const express = require("express");
const React = require("react");
const { renderToString } = require("react-dom/server");

const h = React.createElement;
const app = express();

// Simulated DB call: async, so it goes through the event loop
const getCase = (id) =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve(id === "FIR-001" ? { id, type: "Theft", status: "UNDER INVESTIGATION" } : null),
      50
    )
  );

function CaseStatus({ data }) {
  return h(
    "main",
    null,
    h("h1", null, `Case ${data.id}`),
    h("p", null, `Type: ${data.type}`),
    h("p", null, `Status: ${data.status}`)
  );
}

// Escapes "<" so data in the JSON can't close the <script> tag (XSS)
const safeJSON = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");

// ---------- SSR: HTML arrives already filled in ----------
app.get("/ssr/case/:id", async (req, res) => {
  const data = await getCase(req.params.id);
  if (!data) return res.status(404).send("Case not found");

  const html = renderToString(h(CaseStatus, { data })); // sync, blocks the event loop
  res.send(`<!doctype html>
<html><head><title>Case ${data.id}</title></head>
<body>
  <div id="root">${html}</div>
  <script>window.__INITIAL_DATA__ = ${safeJSON(data)};</script>
  <!-- In a real app: <script src="/client.js"> calls hydrateRoot(...) -->
</body></html>`);
});

// ---------- CSR: empty shell, data fetched in the browser ----------
app.get("/api/case/:id", async (req, res) => {
  const data = await getCase(req.params.id);
  data ? res.json(data) : res.sendStatus(404);
});

app.get("/csr/case/:id", (req, res) => {
  res.send(`<!doctype html>
<html><body>
  <div id="root">Loading...</div>
  <script>
    fetch("/api/case/${encodeURIComponent(req.params.id)}")
      .then(r => r.json())
      .then(d => {
        const root = document.getElementById("root");
        root.textContent = "Case " + d.id + " - " + d.status;
      });
  </script>
</body></html>`);
});

app.listen(4000, () => console.log("http://localhost:4000/ssr/case/FIR-001"));