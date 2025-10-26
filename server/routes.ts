import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, settlementSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all payments
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ 
        error: "Failed to fetch payments", 
        message: error.message 
      });
    }
  });

  // Get recent payments
  app.get("/api/payments/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const payments = await storage.getRecentPayments(limit);
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching recent payments:", error);
      res.status(500).json({ 
        error: "Failed to fetch recent payments", 
        message: error.message 
      });
    }
  });

  // Get payment by ID
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const payment = await storage.getPaymentById(req.params.id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment);
    } catch (error: any) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ 
        error: "Failed to fetch payment", 
        message: error.message 
      });
    }
  });

  // Create new payment
  app.post("/api/payments", async (req, res) => {
    try {
      const result = insertPaymentSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          message: validationError.toString() 
        });
      }

      const payment = await storage.createPayment(result.data);
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(500).json({ 
        error: "Failed to create payment", 
        message: error.message 
      });
    }
  });

  // Update payment
  app.patch("/api/payments/:id", async (req, res) => {
    try {
      const result = insertPaymentSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          message: validationError.toString() 
        });
      }

      const payment = await storage.updatePayment(req.params.id, result.data);
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating payment:", error);
      
      if (error.message === "Payment not found") {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.status(500).json({ 
        error: "Failed to update payment", 
        message: error.message 
      });
    }
  });

  // Delete payment
  app.delete("/api/payments/:id", async (req, res) => {
    try {
      await storage.deletePayment(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      
      if (error.message === "Payment not found") {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.status(500).json({ 
        error: "Failed to delete payment", 
        message: error.message 
      });
    }
  });

  // Settle payment
  app.post("/api/payments/:id/settle", async (req, res) => {
    try {
      const result = settlementSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromError(result.error);
        return res.status(400).json({ 
          error: "Validation failed", 
          message: validationError.toString() 
        });
      }

      const payment = await storage.settlePayment(req.params.id, result.data);
      res.json(payment);
    } catch (error: any) {
      console.error("Error settling payment:", error);
      
      if (error.message === "Payment not found") {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.status(500).json({ 
        error: "Failed to settle payment", 
        message: error.message 
      });
    }
  });

  // Get treasury statistics
  app.get("/api/treasury/stats", async (req, res) => {
    try {
      const stats = await storage.getTreasuryStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching treasury stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch treasury statistics", 
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
