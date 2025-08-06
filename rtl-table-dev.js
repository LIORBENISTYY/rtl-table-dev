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

      tr.highlighted {
        background-color: #ffffcc !important;
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
    }

    onCustomWidgetBeforeUpdate(changedProps) {
      this._props = { ...this._props, ...changedProps };
    }

    async onCustomWidgetAfterUpdate(changedProps) {
      await this.renderTable();
      this.dispatchEvent(new Event("onResultChanged"));
    }

    async renderTable() {
      const dataBinding = this.dataBindings?.getDataBinding("mainBinding");
      if (!dataBinding) return;

      const resultSet = this.mainBinding?.data;
      const metadata = this.mainBinding?.metadata;

      if (!resultSet || !metadata) return;

      const thead = this.shadowRoot.getElementById("rtlTable").querySelector("thead");
      const tbody = this.shadowRoot.getElementById("rtlTable").querySelector("tbody");

      thead.innerHTML = "";
      tbody.innerHTML = "";

      const headers = [];

      for (const dimKey of metadata.feeds.dimensions?.values || []) {
        const dim = metadata.dimensions[dimKey];
        headers.push(dim?.description || dimKey);
      }

      for (const measKey of metadata.feeds.measures?.values || []) {
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

      resultSet.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");
        tr.dataset.index = rowIndex;

        tr.addEventListener("click", () => {
          this.highlightRow(rowIndex);
          this.dispatchEvent(new Event("onSelect"));
          this.dispatchEvent(new Event("onRowClick")); // Optional legacy
        });

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
      });
    }

    highlightRow(index) {
      const rows = this.shadowRoot.getElementById("rtlTable").querySelectorAll("tbody tr");
      this.clearHighlight();
      if (rows[index]) {
        rows[index].classList.add("highlighted");
      }
    }

    clearHighlight() {
      const rows = this.shadowRoot.getElementById("rtlTable").querySelectorAll("tbody tr");
      rows.forEach(row => row.classList.remove("highlighted"));
    }

    triggerAfterDataEntryProcess() {
      this.dispatchEvent(new Event("onAfterDataEntryProcess"));
    }

    onCustomWidgetResize(width, height) {
      // Optional: handle resize if needed
    }
  }

  customElements.define("com-custom-rtl-table", RtlTable);
})();
