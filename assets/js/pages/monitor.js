const logs = JSON.parse(localStorage.getItem("monitor_logs") || "[]");
    const table = document.getElementById("logTable");
    logs.slice(-20).reverse().forEach(log => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${log.time}</td><td>${log.page}</td><td>${log.load_time}</td>`;
      table.appendChild(row);
    });
