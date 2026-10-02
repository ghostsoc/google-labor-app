/**
 * Utility to safely export structured data to CSV format
 * Includes UTF-8 BOM for Microsoft Excel compatibility
 */

export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean | undefined | null)[][]): void {
  const escapeCSVValue = (val: string | number | boolean | undefined | null): string => {
    if (val === undefined || val === null) {
      return '""';
    }
    const str = String(val);
    // If string contains comma, quote, or newline, escape double quotes and wrap in quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCSVValue).join(',');
  const rowLines = rows.map((row) => row.map(escapeCSVValue).join(','));

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
