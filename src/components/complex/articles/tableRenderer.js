import React, { useState } from 'react';

const TableRenderer = ({ content, headers, rows }) => {
  const parseCellContent = (cell) => {
    if (!cell || typeof cell !== 'string') return cell;

    const cleanCell = cell.replace(/^\s*-\s*/, '').trim();

    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = regex.exec(cleanCell)) !== null) {
      const before = cleanCell.slice(lastIndex, match.index);
      if (before) parts.push(before);
      parts.push(
        <span key={`${match.index}-${match[1]}`} className="font-bold text-blue-600" style={{ fontWeight: 700 }}>
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < cleanCell.length) parts.push(cleanCell.slice(lastIndex));

    return parts.length > 0 ? parts : cleanCell;
  };

  if (content) {
    const rows = content.split('\n').filter((row) => row.trim().startsWith('|'));
    if (rows.length < 2) return null;
    const parsedHeaders = rows[0].split('|').filter(Boolean).map((h) => h.trim());
    const dataRows = rows.slice(2).map((row) =>
      row
        .split('|')
        .filter(Boolean)
        .map((c) => parseCellContent(c.trim()))
    );

    return (
      <div className="table-container">
        <table>
          <thead className="tableTitle">
            <tr>
              {parsedHeaders.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((cells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'alternate-row' : ''}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (headers && rows) {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th className="tableTitle" key={i}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'alternate-row' : ''}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{parseCellContent(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style jsx>{`
          .table-container {
            overflow-x: auto;
            margin: 1rem 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #e5e7eb;
            padding: 0.5rem;
            text-align: left;
          }
          .tableTitle {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .alternate-row {
            background-color: #f9fafb;
          }
          .font-bold {
            font-weight: 700 !important;
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default TableRenderer