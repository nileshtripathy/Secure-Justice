// ---------- HOISTING ----------
console.log(caseStatus);            // undefined  (var is hoisted, value is not)
var caseStatus = "OPEN";

try { console.log(firId); }         // ReferenceError: temporal dead zone
catch (e) { console.log(e.name); }
let firId = "FIR-001";

console.log(registerFIR("Theft"));  // works: function declarations are fully hoisted
function registerFIR(type) { return `FIR registered: ${type}`; }

try { verifyEvidence("ev-1"); }     // TypeError: var is hoisted as undefined
catch (e) { console.log(e.name); }
var verifyEvidence = function (id) { return `verified ${id}`; };

// ---------- EVENT LOOP ----------
console.log("1. sync start");

setTimeout(() => console.log("5. macrotask: setTimeout"), 0);

Promise.resolve().then(() => console.log("4. microtask: promise"));

process.nextTick(() => console.log("3. nextTick (runs before promises)"));

console.log("2. sync end");
// Order: 1, 2, 3, 4, 5