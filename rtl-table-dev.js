(function () {
  const template = document.createElement("template");

  template.innerHTML = `
    <style>
      :host {
        display: block;
        overflow: auto;
        direction: rtl;
        font-family: Arial, sans-serif;
        font-size: 14px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        direction: rtl;
        text-align: right;
      }

      th, td {
        border: 1px solid #ccc;
        padding: 8px;
        white-space: nowrap;
      }

      th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
    </style>

    <table id="rtlTable">
      <thead></thead>
      <tbody></tbody>
    </table>
  `;

  class RtlTable extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
      this._props = {};
      this._isDesignTime = false;
    }

    onCustomWidgetBeforeUpdate(changedProps) {
      this._props = { ...this._props, ...changedProps };

      if (changedProps.designMode === true) {
        this._isDesignTime = true;
      }
    }

    async onCustomWidgetAfterUpdate(changedProps) {
      await this.renderTable();
    }

    async renderTable() {
      const thead = this.shadowRoot.getElementById("rtlTable").querySelector("thead");
      const tbody = this.shadowRoot.getElementById("rtlTable").querySelector("tbody");

      thead.innerHTML = "";
      tbody.innerHTML = "";

      // Show sample in Design Mode
      if (this._isDesignTime) {
        this.renderSampleData(thead, tbody);
        return;
      }

      // View Mode: real data
      const dataBinding = this.dataBindings?.getDataBinding("mainBinding");
      if (!dataBinding) return;

      const resultSet = dataBinding?.data;
      const metadata = dataBinding?.metadata;
      if (!resultSet || !metadata) return;

      const dimensionKeys = metadata.feeds.dimensions?.values || [];
      const measureKeys = metadata.feeds.measures?.values || [];

      // ❗ If all dimensions and measures were removed, show empty table
      if (dimensionKeys.length === 0 && measureKeys.length === 0) {
        // Optional: display message
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.textContent = "⚠️ No Dimensions or Measures selected";
        cell.colSpan = 1;
        cell.style.textAlign = "center";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
      }

      // Build headers
      const headers = [];

      for (const dimKey of dimensionKeys) {
        const dim = metadata.dimensions[dimKey];
        headers.push(dim?.description || dimKey);
      }

      for (const measKey of measureKeys) {
        const meas = metadata.mainStructureMembers[measKey];
        headers.push(meas?.label || measKey);
      }

      const headerRow = document.createElement("tr");
      for (const h of headers.reverse()) {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);

      // Build rows
      for (const row of resultSet) {
        const tr = document.createElement("tr");
        const rowCells = [];

        for (const key of dimensionKeys) {
          rowCells.push(row[key]?.label ?? "");
        }

        for (const key of measureKeys) {
          rowCells.push(row[key]?.formatted ?? row[key]?.raw ?? "");
        }

        for (const cell of rowCells.reverse()) {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }
    }

    renderSampleData(thead, tbody) {
      const headers = ["Week", "Year", "Quarter"];
      const headerRow = document.createElement("tr");

      for (const h of headers.reverse()) {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);

      for (let i = 1; i <= 3; i++) {
        const tr = document.createElement("tr");
        const sampleRow = ["W" + i, "20" + i, "Q" + i];

        for (const value of sampleRow.reverse()) {
          const td = document.createElement("td");
          td.textContent = value;
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }
    }

    onCustomWidgetResize(width, height) {
      // Optional
    }
  }

  customElements.define("com-custom-rtl-table", RtlTable);
})();
