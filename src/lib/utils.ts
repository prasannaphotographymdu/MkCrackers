// Currency formatting utility for Indian Rupees (₹)
export function formatINR(amount: number | undefined | null): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

// Clean number formatting without currency symbol
export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

// Date formatter
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Download CSV helper
export function downloadCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((field) => {
          const value = (row as any)[field] ?? '';
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Normalizes pasted Unsplash URLs. If a webpage URL is pasted, converts it to a direct image URL.
 */
export function cleanImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If it's a standard Unsplash share/page URL
  // Example: https://unsplash.com/photos/diwali-fireworks-Hsn7u003_pE
  // Example: https://unsplash.com/photos/white-and-blue-cloudy-sky-f5_lfi2S-d4
  // Example: https://unsplash.com/photos/Hsn7u003_pE
  if (trimmed.includes('unsplash.com/photos/')) {
    try {
      const urlWithoutQuery = trimmed.split('?')[0];
      const parts = urlWithoutQuery.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1];
      
      if (lastPart) {
        // Unsplash photo IDs are consistently exactly 11 characters long
        const photoId = lastPart.length >= 11 ? lastPart.slice(-11) : lastPart;
        return `https://images.unsplash.com/photo-${photoId}?w=500&auto=format&fit=crop&q=80`;
      }
    } catch (err) {
      console.warn('Error parsing Unsplash photo ID:', err);
    }
  }
  return trimmed;
}
