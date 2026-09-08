import { useState } from "react";
import { Card, CardHeader, Badge, Table, Td } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { suppliers, purchaseOrders } from "../data/demo";
import { naira } from "../lib/utils";
import {
  Boxes,
  FileCheck2,
  Truck,
  ClipboardList,
  FileText,
  Users,
  ShieldCheck,
} from "lucide-react";
import { MultiStoreInventoryView } from "../components/supplychain/MultiStoreInventoryView";
import { ProcureToPayView } from "../components/supplychain/ProcureToPayView";
import { GoodsReceiptView } from "../components/supplychain/GoodsReceiptView";
import { StocktakeAuditView } from "../components/supplychain/StocktakeAuditView";
import { SupplierContractView } from "../components/supplychain/SupplierContractView";

const PO_STATUS: Record<string, string> = {
  draft: "border-stone-400/40 bg-stone-500/10 text-stone-300",
  pending_approval: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  approved: "border-sky-400/40 bg-sky-500/10 text-sky-200",
  received: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<
    "multistore" | "procure" | "contracts" | "grn" | "stocktake" | "po" | "suppliers"
  >("multistore");

  const tabs: Array<[typeof activeTab, string, any]> = [
    ["multistore", "Perpetual Stock & Stores", Boxes],
    ["contracts", "Supplier Contracts & SLAs", ShieldCheck],
    ["procure", "Requisitions (P2P)", FileCheck2],
    ["grn", "Goods Receipts (GRN)", Truck],
    ["stocktake", "Stocktake & Variance", ClipboardList],
    ["po", "Purchase Orders", FileText],
    ["suppliers", "Supplier Directory", Users],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supply Chain &amp; Inventory Management"
        subtitle="Multi-Store Stock · Supplier Contract Management &amp; SLAs · Procure-to-Pay · Dock Inspections (GRN) · Physical Stocktake Reconciliation"
      />

      {/* Sub-module Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-brand-800/80 pb-3">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
              activeTab === key
                ? "border-gold-400/50 bg-brand-500/20 font-semibold text-gold-200 shadow-sm"
                : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600 hover:text-brand-50"
            }`}
          >
            <Icon size={15} className={activeTab === key ? "text-gold-300" : "text-brand-300"} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "multistore" && <MultiStoreInventoryView />}
      {activeTab === "contracts" && <SupplierContractView />}
      {activeTab === "procure" && <ProcureToPayView />}
      {activeTab === "grn" && <GoodsReceiptView />}
      {activeTab === "stocktake" && <StocktakeAuditView />}

      {activeTab === "po" && (
        <Card>
          <CardHeader
            title="Purchase Orders Register"
            subtitle="Procurement commitments with 3-way matching status"
          />
          <Table head={["PO #", "Supplier", "Date", "Value", "Status"]}>
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-brand-800/30">
                <Td><span className="font-mono text-xs text-gold-300">{po.poNumber}</span></Td>
                <Td>{suppliers.find((s) => s.id === po.supplierId)?.name}</Td>
                <Td>{po.orderDate}</Td>
                <Td>{naira(po.total)}</Td>
                <Td><Badge className={PO_STATUS[po.status]}>{po.status.replace("_", " ")}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {activeTab === "suppliers" && (
        <Card>
          <CardHeader
            title="Hospitality Supplier Register"
            subtitle="Approved vendors, payment terms and food safety certifications"
          />
          <Table head={["Supplier", "Contact", "Phone", "Email", "Terms"]}>
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-brand-800/30">
                <Td className="font-medium text-brand-50">{s.name}</Td>
                <Td>{s.contactPerson}</Td>
                <Td>{s.phone}</Td>
                <Td>{s.email}</Td>
                <Td><Badge className="border-brand-700 bg-brand-900 text-brand-100">{s.paymentTerms}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}

