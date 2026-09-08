import { useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import { Plus } from "lucide-react";

export function ProcureToPayView() {
  const {
    purchaseRequisitions,
    approvePurchaseRequisition,
    createPurchaseRequisition,
  } = usePlatform();

  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [showNewPrModal, setShowNewPrModal] = useState(false);

  // New PR Form
  const [deptInput, setDeptInput] = useState("Food & Beverage / Kitchen");
  const [requestedBy, setRequestedBy] = useState("Executive Chef");
  const [budgetCode, setBudgetCode] = useState("GL-5100-FNB");
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState(10);
  const [unit, setUnit] = useState("kg");
  const [estCost, setEstCost] = useState(150000);
  const [justification, setJustification] = useState("Buffer stock for upcoming State Banquet");

  const filteredPrs =
    filterDepartment === "all"
      ? purchaseRequisitions
      : purchaseRequisitions.filter((pr) => pr.department === filterDepartment);

  const totalPrValue = purchaseRequisitions.reduce((acc, pr) => acc + pr.estimatedTotal, 0);
  const pendingCount = purchaseRequisitions.filter((pr) => pr.status === "pending_approval").length;
  const approvedCount = purchaseRequisitions.filter((pr) => pr.status === "approved" || pr.status === "po_created").length;

  const handleCreatePr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;
    createPurchaseRequisition({
      prNumber: `PR-2026-${Math.floor(100 + Math.random() * 900)}`,
      department: deptInput,
      requestedBy,
      date: new Date().toISOString().slice(0, 10),
      requiredByDate: "2026-09-18",
      status: "pending_approval",
      budgetCode,
      estimatedTotal: estCost,
      justification,
      items: [
        {
          itemName,
          quantity: qty,
          unit,
          estimatedUnitCost: Math.round(estCost / (qty || 1)),
          total: estCost,
        },
      ],
    });
    setShowNewPrModal(false);
    setItemName("");
  };

  return (
    <div className="space-y-6">
      {/* Procure to Pay KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active PR Commitments"
          value={naira(totalPrValue, true)}
          sub="Requisitions in lifecycle"
          accent="gold"
        />
        <StatCard
          label="Pending Financial Approval"
          value={String(pendingCount)}
          sub="Financial Controller review"
          accent="amber"
        />
        <StatCard
          label="Approved / PO Created"
          value={String(approvedCount)}
          sub="Ready for vendor dispatch"
          accent="emerald"
        />
        <StatCard
          label="Average P2P Turnaround"
          value="1.8 Days"
          sub="Requisition to PO issue"
          accent="sky"
        />
      </div>

      {/* Header and Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            Filter Department:
          </span>
          {["all", "Food & Beverage / Kitchen", "Housekeeping & Linen", "Engineering & Maintenance"].map(
            (dept) => (
              <button
                key={dept}
                onClick={() => setFilterDepartment(dept)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterDepartment === dept
                    ? "bg-gold-500/20 text-gold-200 border border-gold-400/40"
                    : "text-brand-200/70 hover:bg-brand-800/40"
                }`}
              >
                {dept === "all" ? "All Departments" : dept}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => setShowNewPrModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition"
        >
          <Plus size={14} />
          Create Requisition (PR)
        </button>
      </div>

      {/* Requisition Table */}
      <Card>
        <CardHeader
          title="Hospitality Purchase Requisitions (P2P)"
          subtitle="Departmental requisitions with budget code validations and authorization matrix"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-brand-800/60 bg-brand-950/40 text-brand-300">
              <tr>
                <th className="px-5 py-3 font-medium">PR # &amp; Date</th>
                <th className="px-4 py-3 font-medium">Department &amp; Requester</th>
                <th className="px-4 py-3 font-medium">Items Requested</th>
                <th className="px-4 py-3 font-medium">GL Budget Code</th>
                <th className="px-4 py-3 text-right font-medium">Est. Value</th>
                <th className="px-4 py-3 text-center font-medium">Approval Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-800/30">
              {filteredPrs.map((pr) => {
                const isPending = pr.status === "pending_approval";
                const isApproved = pr.status === "approved";
                const isPoCreated = pr.status === "po_created";

                return (
                  <tr key={pr.id} className="hover:bg-brand-800/20">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-mono text-xs font-semibold text-gold-300">
                          {pr.prNumber}
                        </span>
                        <p className="text-[10px] text-brand-300/60 font-mono mt-0.5">{pr.date}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-brand-100">{pr.department}</p>
                      <span className="text-[11px] text-brand-300/60">By: {pr.requestedBy}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        {pr.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-brand-200">
                            <span className="font-medium text-brand-50">{item.itemName}</span>{" "}
                            <span className="text-[11px] text-brand-300/70 font-mono">
                              ({item.quantity} {item.unit})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-brand-800/80 px-2 py-0.5 font-mono text-[10px] text-brand-200">
                        {pr.budgetCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-gold-300">
                      {naira(pr.estimatedTotal)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {isPending && (
                        <Badge className="border-amber-400/40 bg-amber-500/10 text-amber-300 text-[10px]">
                          Pending Approval
                        </Badge>
                      )}
                      {isApproved && (
                        <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]">
                          Approved
                        </Badge>
                      )}
                      {isPoCreated && (
                        <Badge className="border-sky-400/40 bg-sky-500/10 text-sky-300 text-[10px]">
                          PO Issued
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isPending ? (
                        <button
                          onClick={() => approvePurchaseRequisition(pr.id)}
                          className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                        >
                          Approve PR
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium">✓ Authorized</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New PR Modal */}
      {showNewPrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreatePr}
            className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Create Purchase Requisition (PR)
            </h3>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Department</label>
              <select
                value={deptInput}
                onChange={(e) => setDeptInput(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              >
                <option value="Food & Beverage / Kitchen">Food &amp; Beverage / Kitchen</option>
                <option value="Housekeeping & Linen">Housekeeping &amp; Linen</option>
                <option value="Engineering & Maintenance">Engineering &amp; Maintenance</option>
                <option value="Front Office / Guest Services">Front Office / Guest Services</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Requester Title</label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">GL Budget Code</label>
                <input
                  type="text"
                  value={budgetCode}
                  onChange={(e) => setBudgetCode(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Item Description</label>
              <input
                required
                type="text"
                placeholder="e.g. Imported Basmati Rice 25kg bags"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Quantity</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Est. Cost (₦)</label>
                <input
                  type="number"
                  value={estCost}
                  onChange={(e) => setEstCost(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Business Justification</label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-xs text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewPrModal(false)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 shadow"
              >
                Submit Requisition
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
