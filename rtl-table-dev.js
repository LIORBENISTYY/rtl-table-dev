(function () {
  const template = document.createElement("template");

  template.innerHTML = `
    <style>
      :host {
        display: block;
        overflow: auto;
        direction: rtl; /* RTL layout */
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

    <table id="rtlTableDev">
      <thead></thead>
      <tbody></tbody>
    </table>
  `;

  class RtlTableDev extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
      this._props = {};
    }

    onCustomWidgetBeforeUpdate(changedProps) {
      this._props = { ...this._props, ...changedProps };
    }

    async onCustomWidgetAfterUpdate(changedProps) {
      this.renderTable();
    }

    async renderTable() {
      const dataBinding = this.dataBindings?.getDataBinding("mainBinding");
      if (!dataBinding) return;

      const resultSet = this.mainBinding?.data;
      const metadata = this.mainBinding?.metadata;

      if (!resultSet || !metadata) return;

      const thead = this.shadowRoot.getElementById("rtlTableDev").querySelector("thead");
      const tbody = this.shadowRoot.getElementById("rtlTableDev").querySelector("tbody");

      thead.innerHTML = "";
      tbody.innerHTML = "";

      const headers = [];

      // Build headers from dimensions
      for (const dimKey of metadata.feeds.dimensions?.values || []) {
        const dim = metadata.dimensions[dimKey];
        headers.push(dim?.description || dimKey);
      }

      // Build headers from measures
      for (const measKey of metadata.feeds.measures?.values || []) {
        const meas = metadata.mainStructureMembers[measKey];
        headers.push(meas?.label || measKey);
      }

      // Render <thead>
      const headerRow = document.createElement("tr");
      for (const h of headers.reverse()) {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);

      // Render <tbody>
      for (const row of resultSet) {
        const tr = document.createElement("tr");
        const rowCells = [];

        for (const dimKey of metadata.feeds.dimensions?.values || []) {
          rowCells.push(row[dimKey]?.label ?? "");
        }

        for (const measKey of metadata.feeds.measures?.values || []) {
          rowCells.push(row[measKey]?.formatted ?? row[measKey]?.raw ?? "");
        }

        for (const cell of rowCells.reverse()) {
          const td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }
    }

    onCustomWidgetResize(width, height) {
      // Optional: handle resizing
    }
  }

  customElements.define("com-custom-rtl-table-dev", RtlTableDev);
})();
