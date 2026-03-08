-- Migration: Add VariantReorderParams table for ROP/EOQ
-- Drops ReorderDefaultParams if it exists (from previous version)
DROP TABLE IF EXISTS ReorderDefaultParams;

CREATE TABLE IF NOT EXISTS VariantReorderParams (
    VariantID INTEGER NOT NULL REFERENCES ProductVariants(VariantID) ON DELETE CASCADE,
    WarehouseID INTEGER NOT NULL REFERENCES Warehouses(WarehouseID) ON DELETE CASCADE,
    DailyDemand DECIMAL(10,2) NOT NULL DEFAULT 5,
    LeadTimeDays INTEGER NOT NULL DEFAULT 7,
    SafetyStock INTEGER NOT NULL DEFAULT 10,
    OrderingCost DECIMAL(10,2) NOT NULL DEFAULT 100,
    HoldingCostPercent DECIMAL(5,2) NOT NULL DEFAULT 10,
    UpdatedDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (VariantID, WarehouseID)
);
