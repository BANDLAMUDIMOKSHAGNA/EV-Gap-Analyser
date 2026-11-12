/**
 * Formatting utilities for Indian currency, metrics, and numbers.
 */

export function formatINR(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  const abs = Math.abs(val);

  if (abs >= 10000000) {
    // Crores
    const cr = val / 10000000;
    return `₹${cr.toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    // Lakhs
    const lk = val / 100000;
    return `₹${lk.toFixed(2)} Lakh`;
  } else {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  }
}

export function formatIndianNumber(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1
  }).format(val);
}

export function formatDistanceKm(meters: number): string {
  if (meters === undefined || meters === null) return "--";
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatMinutes(mins: number): string {
  if (mins === undefined || mins === null) return "--";
  return `${mins.toFixed(0)} min`;
}

export function formatDate(isoStr?: string): string {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return isoStr;
  }
}
