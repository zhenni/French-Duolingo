// Morandi palette (soft muted colors)
const morandiColors = ["#B8AFAF", "#C1B6A6", "#A8B3A1", "#BFB3B3", "#ADA698"];

// Load CSV
async function loadCSV(path) {
  const response = await fetch(path);
  const text = await response.text();
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  const rows = lines.slice(1);

  const data = [];
  rows.forEach(line => {
    const [category, color, word, meaning] = line.split(",");
    let block = data.find(b => b.category === category);
    if (!block) {
      block = { category, color: color || morandiColors[data.length % morandiColors.length], words: [] };
      data.push(block);
    }
    block.words.push({ word, meaning });
  });

  return data;
}

// Render blocks
function renderWordBlocks(data) {
  const container = document.getElementById("word-blocks-container");
  container.innerHTML = "";

  data.forEach((block, index) => {
    const blockDiv = document.createElement("div");
    blockDiv.className = "word-block";
    const blockId = `block-${index}`;
    blockDiv.id = blockId;

    // Title
    const title = document.createElement("div");
    title.className = "word-block-title";
    title.textContent = block.category;
    blockDiv.appendChild(title);

    // Subtle Morandi accent
    const accent = block.color;
    const style = document.createElement("style");
    style.textContent = `
      #${blockId} .word-block-title::before { 
        background: ${accent}; 
      }
      #${blockId} .word-table td {
        color: #555;
      }
      #${blockId} .word-table button {
        background-color: ${accent};
        color: #fff;
        font-weight: 500;
      }
      #${blockId} .word-table tr.pronounced td {
        background-color: ${accent}33 !important; /* semi-transparent highlight */
      }
    `;
    document.head.appendChild(style);

    // Table
    const table = document.createElement("table");
    table.className = "word-table";
    table.innerHTML = `<thead>
      <tr><th>Word</th><th>Meaning</th><th>Pronunciation</th></tr>
    </thead>`;
    const tbody = document.createElement("tbody");

    block.words.forEach(entry => {
      const tr = document.createElement("tr");

      const tdWord = document.createElement("td");
      tdWord.textContent = entry.word;

      const tdMeaning = document.createElement("td");
      tdMeaning.textContent = entry.meaning;

      const tdButton = document.createElement("td");
      const button = document.createElement("button");
      button.textContent = "🔊";
      button.onclick = () => {
        tr.classList.add("pronounced");
        setTimeout(() => tr.classList.remove("pronounced"), 700);

        const utterance = new SpeechSynthesisUtterance(entry.word);
        utterance.lang = "fr-FR";
        speechSynthesis.speak(utterance);
      };
      tdButton.appendChild(button);

      tr.appendChild(tdWord);
      tr.appendChild(tdMeaning);
      tr.appendChild(tdButton);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    blockDiv.appendChild(table);
    container.appendChild(blockDiv);
  });
}

// Load CSV and render
// ✅ CORRECT CSV PATH RESOLUTION
const container = document.getElementById("word-blocks-container");
// const csvPath = container.dataset.csv;
// loadCSV(csvPath).then(renderWordBlocks);

// lazy load
const cache = new Map(); // csvPath → parsed data

async function loadSection(csvPath) {
  // Already loaded → reuse
  if (cache.has(csvPath)) {
    renderWordBlocks(cache.get(csvPath));
    return;
  }

  try {
    const data = await loadCSV(csvPath);
    cache.set(csvPath, data);
    renderWordBlocks(data);
  } catch (err) {
    console.error("Failed to load:", csvPath, err);
  }
}

// Hook up buttons
document.querySelectorAll("#sections button").forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active from all
    document.querySelectorAll("#sections button").forEach(b => b.classList.remove("active"));
    // Set active for clicked
    btn.classList.add("active");

    loadSection(btn.dataset.csv);
  });
});


