import { useState } from "react";
import { Card, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { GoodsReceivedNote } from "../../types";
import {
  CheckCircle,
  Thermometer,
  PackageCheck,
} from "lucide-react";

export function GoodsReceiptView() {
  const { goodsReceiptNotes, receiveGrn } = usePlatform();
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceivedNote | null>(
    goodsReceiptNotes[0] || null
  );

  const totalReceivedValue = goodsReceiptNotes
    .filter((g) => g.status === "received")
    .reduce((acc, g) => acc + g.totalValue, 0);
  const inspectionPassedCount = goodsReceiptNotes.filter((g) => g.qualityInspectionPassed).length;

  return (
    <div className="space-y-6">
      {/* GRN KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Dock Intake Valuation"
          value={naira(totalReceivedValue, true)}
          sub="Received goods this month"
          accent="emerald"
        />
        <StatCard
          label="Quality Pass Rate"
          value={`${Math.round((inspectionPassedCount / (goodsReceiptNotes.length || 1)) * 100)}%`}
          sub="Cold chain & specs check"
          accent="gold"
        />
        <StatCard
          label="Loading Dock Turnaround"
          value="42 min"
          sub="Offload to store bin"
          accent="sky"
        />
        <StatCard
          label="Discrepancies / Rejections"
          value="0 Claims"
          sub="No supplier disputes"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <span className="text-xs text-brand-300">
          Goods Received Notes (GRN) verify physical counts, cold chain compliance (temperature log), and drive AP 3-Way Matching.
        </span>
      </div>

      {/* GRN Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: GRN Master List */}
        <Card className="lg:col-span-5 p-0">
          <div className="border-b border-brand-800/80 bg-brand-900/60 p-4">
            <h3 className="font-display font-semibold text-brand-50">Goods Receipt Register</h3>
            <p className="text-xs text-brand-200/60">PO fulfillment and quality inspection logs</p>
          </div>
          <div className="divide-y divide-brand-800/40">
            {goodsReceiptNotes.map((g) => {
              const isSelected = g.id === selectedGrn?.id;
              const isReceived = g.status === "received";

              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGrn(g)}
                  className={`w-full text-left p-4 transition ${
                    isSelected
                      ? "bg-brand-800/60 border-l-4 border-l-gold-400"
                      : "hover:bg-brand-800/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gold-300 font-semibold">
                          {g.grnNumber}
                        </span>
                        <Badge
                          className={
                            isReceived
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]"
                              : "border-amber-400/40 bg-amber-500/10 text-amber-300 text-[10px]"
                          }
                        >
                          {g.status.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-brand-50 mt-1">{g.supplierName}</h4>
                      <p className="text-xs text-brand-200/60">
                        {g.poNumber} · Delivery: {g.deliveryNoteNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold text-brand-100">
                        {naira(g.totalValue)}
                      </span>
                      <p className="text-[11px] text-brand-300/60 mt-0.5">{g.receivedDate}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right: GRN Inspection & Breakdown Detail */}
        {selectedGrn && (
          <Card className="lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between border-b border-brand-800/80 p-5">
              <div>
                <span className="font-mono text-xs text-gold-300 font-semibold">
                  {selectedGrn.grnNumber} · Delivery Dock Intake
                </span>
                <h2 className="text-xl font-display font-bold text-brand-50 mt-1">
                  {selectedGrn.supplierName}
                </h2>
                <p className="text-xs text-brand-200/60 mt-1">
                  PO Reference: <span className="font-mono text-brand-200">{selectedGrn.poNumber}</span> · Delivery Note:{" "}
                  <span className="font-mono text-brand-200">{selectedGrn.deliveryNoteNumber}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-brand-200/60">Verified Total</span>
                <p className="font-display text-2xl font-bold text-gold-300">
                  {naira(selectedGrn.totalValue)}
                </p>
                <p className="text-[11px] text-brand-300/60">Received by: {selectedGrn.receivedBy}</p>
              </div>
            </div>

            {/* Quality & Cold Chain Compliance Ribbon */}
            <div className="grid grid-cols-2 divide-x divide-brand-800/60 border-b border-brand-800/80 bg-brand-950/40 p-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                  <PackageCheck size={18} />
                </div>
                <div>
                  <span className="font-semibold text-brand-100">Quality Inspection</span>
                  <p className="text-emerald-400 font-medium">
                    {selectedGrn.qualityInspectionPassed ? "✓ Passed Specifications" : "⚠ Hold"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
                  <Thermometer size={18} />
                </div>
                <div>
                  <span className="font-semibold text-brand-100">Cold Chain Temperature</span>
                  <p className="font-mono text-brand-200">
                    {selectedGrn.temperatureCheck != null ? `${selectedGrn.temperatureCheck}°C` : "N/A (Dry goods)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="p-5">
              <h4 className="text-sm font-semibold text-brand-50 mb-3">
                Received Line Items &amp; Quantity Verifications
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
                    <tr>
                      <th className="px-4 py-2 font-medium">Item Description</th>
                      <th className="px-3 py-2 text-right font-medium">Ordered</th>
                      <th className="px-3 py-2 text-right font-medium">Accepted</th>
                      <th className="px-3 py-2 text-right font-medium">Rejected</th>
                      <th className="px-4 py-2 text-right font-medium">Unit Price</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-800/30">
                    {selectedGrn.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand-800/20">
                        <td className="px-4 py-2.5 font-medium text-brand-100">{item.itemName}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-brand-300">
                          {item.quantityOrdered} {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-emerald-400 font-semibold">
                          {item.quantityReceived} {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-rose-400">
                          {item.quantityRejected} {item.unit}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-brand-200">
                          {naira(item.unitPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gold-300">
                          {naira(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedGrn.status === "inspecting" && (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => receiveGrn(selectedGrn.id)}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-emerald-400 transition"
                  >
                    <CheckCircle size={15} />
                    Authorize GRN &amp; Update Perpetual Stock
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
