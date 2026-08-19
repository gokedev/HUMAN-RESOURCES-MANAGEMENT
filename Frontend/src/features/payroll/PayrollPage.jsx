import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Wallet, Printer, FileText } from "lucide-react";
import { PageHeader } from "../../components/common/ui.jsx";
import { DataTableShell, TableSkeleton, EmptyState } from "../../components/feedback.jsx";
import { StatusBadge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Select } from "../../components/ui/select.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table.jsx";
import { ConfirmDialog } from "../../components/ui/dialog.jsx";
import { usePageTitle } from "../../hooks.js";
import { useToast } from "../../contexts.jsx";
import { payrollService } from "../../api.js";
import { queryKeys } from "../../constants.js";
import { getErrorMessage, queryInvalidation } from "../../utils.js";
import { PayslipViewModal } from "./PayslipView.jsx";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];

function formatMoney(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function PayrollPage() {
  usePageTitle("Payroll");
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [viewPayslip, setViewPayslip] = useState(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  const periodParams = { month: selectedMonth, year: selectedYear };

  const { data: payslips, isLoading, isError } = useQuery({
    queryKey: queryKeys.payroll.period(periodParams),
    queryFn: () => payrollService.listForPeriod(periodParams),
  });

  const generateMutation = useMutation({
    mutationFn: (payload) => payrollService.generate(payload),
    onSuccess: async (data) => {
      await queryInvalidation.afterPayrollChange(queryClient);
      notify({
        title: "Payroll generated",
        message: `${data.created} payslip(s) created. ${data.skipped > 0 ? `${data.skipped} already existed and were skipped.` : ""}`,
        variant: "success",
      });
    },
    onError: (error) => notify({ title: "Generation failed", message: getErrorMessage(error), variant: "danger" }),
  });

  function handleGenerate(overwrite) {
    setShowOverwriteConfirm(false);
    generateMutation.mutate({ month: selectedMonth, year: selectedYear, overwriteExisting: overwrite });
  }

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y);

  return (
    <>
      <PageHeader
        title="Payroll"
        description="Generate and manage employee payslips."
      />

      {/* Run Payroll Section */}
      <section className="rounded-xl border bg-card shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Run Payroll</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Select a pay period and generate payslips for all active employees with a salary on record.</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-1.5">
              <Label>Month</Label>
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
            <Button
              onClick={() => {
                if (payslips && payslips.length > 0) {
                  setShowOverwriteConfirm(true);
                } else {
                  handleGenerate(false);
                }
              }}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Wallet size={16} className="mr-2" />
              )}
              Generate Payroll
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Tax deduction is a flat 10% (illustrative). Unpaid leave deduction is calculated from approved UNPAID leave requests in this period.</p>
        </div>
      </section>

      {/* Payslips Table */}
      <DataTableShell
        title={`${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear} Payslips`}
        description={`Generated payslips for the selected period.`}
      >
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <EmptyState icon={FileText} title="Failed to load payslips" description="Please try again later." />
        ) : !payslips || payslips.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No payslips yet"
            description="No payroll has been generated for this period. Use 'Generate Payroll' above to create payslips."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Gross Salary</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{p.employeeEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatMoney(p.grossSalary)}</TableCell>
                      <TableCell className="text-right text-sm text-red-600 dark:text-red-400">
                        −{formatMoney(p.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatMoney(p.netPay)}</TableCell>
                      <TableCell>
                        <button
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium transition-colors duration-150"
                          onClick={() => setViewPayslip(p)}
                        >
                          <Printer size={14} /> View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
              {payslips.length} payslip(s) generated for this period.
            </div>
          </>
        )}
      </DataTableShell>

      {/* Overwrite Confirmation */}
      {showOverwriteConfirm && (
        <ConfirmDialog
          title="Overwrite existing payslips?"
          message={`Payslips already exist for ${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear}. Regenerating will overwrite them.`}
          confirmLabel="Overwrite & Regenerate"
          onConfirm={() => handleGenerate(true)}
          onClose={() => setShowOverwriteConfirm(false)}
          isProcessing={generateMutation.isPending}
        />
      )}

      {/* Payslip View Modal */}
      {viewPayslip && (
        <PayslipViewModal payslip={viewPayslip} onClose={() => setViewPayslip(null)} />
      )}
    </>
  );
}
