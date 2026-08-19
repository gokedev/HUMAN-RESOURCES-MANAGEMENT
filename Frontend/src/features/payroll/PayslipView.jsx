import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function PayslipViewModal({ payslip, onClose }) {
  if (!payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-xl" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Payslip</DialogTitle>
        </DialogHeader>

        <div className="payslip-print-area space-y-5">
          {/* Header */}
          <div className="text-center border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground">CoralHR</h3>
            <p className="text-sm text-muted-foreground">Payslip for {MONTH_NAMES[payslip.payPeriodMonth]} {payslip.payPeriodYear}</p>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Employee:</span>
            </div>
            <div className="break-words font-medium text-left sm:text-right">{payslip.employeeName}</div>
            <div>
              <span className="text-muted-foreground">Email:</span>
            </div>
            <div className="break-words text-left sm:text-right">{payslip.employeeEmail}</div>
            <div>
              <span className="text-muted-foreground">Pay Period:</span>
            </div>
            <div className="text-left sm:text-right">{MONTH_NAMES[payslip.payPeriodMonth]} {payslip.payPeriodYear}</div>
          </div>

          {/* Earnings */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 text-sm font-semibold">Earnings</div>
            <div className="px-4 py-2.5 flex justify-between text-sm border-t border-border">
              <span>Gross Salary</span>
              <span className="font-medium">{formatMoney(payslip.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 text-sm font-semibold">Deductions</div>
            <div className="px-4 py-2.5 flex justify-between text-sm border-t border-border">
              <span>
                Unpaid Leave ({payslip.unpaidLeaveDays} day{payslip.unpaidLeaveDays !== 1 ? "s" : ""})
              </span>
              <span className="font-medium text-red-600 dark:text-red-400">{formatMoney(payslip.unpaidLeaveDeduction)}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-sm border-t border-border">
              <span>Tax (10%, illustrative)</span>
              <span className="font-medium text-red-600 dark:text-red-400">{formatMoney(payslip.taxDeduction)}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-sm border-t border-border bg-muted/30 font-semibold">
              <span>Total Deductions</span>
              <span className="text-red-600 dark:text-red-400">{formatMoney(payslip.totalDeductions)}</span>
            </div>
          </div>

          {/* Net Pay */}
          <div className="rounded-lg border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3 flex justify-between items-center">
            <span className="text-base font-bold">Net Pay</span>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(payslip.netPay)}</span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Generated: {new Date(payslip.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 print:hidden">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-150"
            onClick={handlePrint}
          >
            Print
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
