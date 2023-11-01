const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const app = express();
var favicon = require('serve-favicon')

//huffman

// class HuffmanNode {
//   constructor(char, freq) {
//     this.char = char;
//     this.freq = freq;
//     this.left = null;
//     this.right = null;
//   }
// }

// function buildHuffmanTree(freqMap) {
//   const heap = Object.keys(freqMap).map(
//     (char) => new HuffmanNode(char, freqMap[char])
//   );

//   while (heap.length > 1) {
//     heap.sort((a, b) => a.freq - b.freq);
//     const left = heap.shift();
//     const right = heap.shift();
//     const merged = new HuffmanNode(null, left.freq + right.freq);
//     merged.left = left;
//     merged.right = right;
//     heap.push(merged);
//   }

//   return heap[0];
// }

// function buildHuffmanCodes(root, currentCode, huffmanCodes) {
//   if (!root) return;

//   if (root.char) {
//     huffmanCodes[root.char] = currentCode;
//     return;
//   }

//   buildHuffmanCodes(root.left, currentCode + "0", huffmanCodes);
//   buildHuffmanCodes(root.right, currentCode + "1", huffmanCodes);
// }
// let root;
// let text;
// function readit(inputFile) {
//   text = fs.readFileSync(inputFile, "utf8");
//   const frequencyMap = {};

//   for (const char of text) {
//     frequencyMap[char] = (frequencyMap[char] || 0) + 1;
//   }

//   root = buildHuffmanTree(frequencyMap);
// }

// function compressFile(inputFile, outputFile) {
//   readit(inputFile);
//   const huffmanCodes = {};
//   buildHuffmanCodes(root, "", huffmanCodes);

//   const encodedText = Array.from(text)
//     .map((char) => huffmanCodes[char])
//     .join("");

//   fs.writeFileSync(outputFile, encodedText, "utf8");
// }

// function decompressFile(ipfile, inputFile, outputFile) {
//   readit(ipfile);
//   const encodedText = fs.readFileSync(inputFile, "utf8");
//   let current = root;
//   const decodedText = [];

//   for (const bit of encodedText) {
//     if (bit === "0") {
//       current = current.left;
//     } else {
//       current = current.right;
//     }

//     if (current.char !== null) {
//       decodedText.push(current.char);
//       current = root;
//     }
//   }

//   const decodedTextString = decodedText.join("");
//   fs.writeFileSync(outputFile, decodedTextString, "utf8");
// }


class Node {
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}
let rt;
function buildHuffmanTree(text) {
  const charFrequency = new Map();

  for (let char of text) {
    if (charFrequency.has(char)) {
      charFrequency.set(char, charFrequency.get(char) + 1);
    } else {
      charFrequency.set(char, 1);
    }
  }

  const nodes = Array.from(charFrequency, ([char, freq]) => new Node(char, freq));

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new Node(null, left.freq + right.freq);
    parent.left = left;
    parent.right = right;
    nodes.push(parent);
  }

  return nodes[0];
}

function generateHuffmanCodes(root, prefix = '', codes = {}) {
  if (root) {
    if (root.char !== null) {
      codes[root.char] = prefix;
    }
    generateHuffmanCodes(root.left, prefix + '0', codes);
    generateHuffmanCodes(root.right, prefix + '1', codes);
  }
  return codes;
}

function encodeTextToBytes(text, codes) {
  let encodedText = '';
  for (let char of text) {
    encodedText += codes[char];
  }

  const byteLength = Math.ceil(encodedText.length / 8);
  const bytes = new Uint8Array(byteLength);

  for (let i = 0; i < encodedText.length; i++) {
    if (encodedText[i] === '1') {
      const byteIndex = Math.floor(i / 8);
      const bitOffset = 7 - (i % 8);
      bytes[byteIndex] |= 1 << bitOffset;
    }
  }

  return bytes;
}

function writeBinaryFile(fileName, data) {
  fs.writeFileSync(fileName, data);
}

function compressText(inputFileName, outputFileName) {
  const text = fs.readFileSync(inputFileName, 'utf-8');
  const huffmanTree = buildHuffmanTree(text);
  rt=huffmanTree;
  const huffmanCodes = generateHuffmanCodes(huffmanTree);
//   console.log(rt);
  const encodedText = encodeTextToBytes(text, huffmanCodes);
  writeBinaryFile(outputFileName, encodedText);
}

function readBinaryFile(fileName) {
  return fs.readFileSync(fileName);
}

function decodeBytesToText(bytes, huffmanTree) {
  let decodedText = '';
  let currentNode = huffmanTree;

  for (let byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      const bit = (byte >> i) & 1;
      if (bit === 0) {
        currentNode = currentNode.left;
      } else {
        currentNode = currentNode.right;
      }

      if (currentNode.char !== null) {
        decodedText += currentNode.char;
        currentNode = huffmanTree;
      }
    }
  }

  return decodedText;
}

function decompressFile(input,inputFileName, outputFileName) {
  const text = fs.readFileSync(input, 'utf-8');
  rt = buildHuffmanTree(text);
  const encodedBytes = readBinaryFile(inputFileName);
  
  const huffmanTree = buildHuffmanTree(encodedBytes.toString('utf-8'));
  // console.log(huffmanTree,"\n",rt);
  const decodedText = decodeBytesToText(encodedBytes, rt);

let newStr = decodedText.slice(0, -1);
// console.log(newStr);
  fs.writeFileSync(outputFileName, newStr, 'utf-8');
}


//finish

app.use(express.json());

app.use(express.static(path.join(__dirname,"public")))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", "./view");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `input.txt`);
  },
});
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `compress.bin`);
  },
});
app.use(express.static(path.join(__dirname, 'view')))

const upload = multer({ storage: storage });
const upload1 = multer({ storage: storage1 });

app.get("/", (req, res) => {
  res.status(200).render("Mainpage");
});
app.get("/about", (req, res) => {
  res.status(200).render("about");
});
app.get("/manual", (req, res) => {
  res.status(200).render("manual");
});
app.get("/compress", (req, res) => {
  res.status(200).render("compress");
});
app.get("/dcompress", (req, res) => {
  res.status(200).render("decompress");
});

app.get('/downloadfilec', (req, res) => {
  const filePath = path.join(__dirname,"uploads/compress.bin"); // Replace with the actual file path
  res.download(filePath);
});
app.get('/downloadfiled', (req, res) => {
  const filePath = path.join(__dirname,"uploads/decompress.txt"); // Replace with the actual file path
  res.download(filePath);
  // res.redirect("/")
});


app.post("/cupload", upload.single("input"), (req, res) => {
  compressText("./uploads/input.txt", "./uploads/compress.bin");
  res.redirect("/downloadfilec");
});
app.post("/dupload", upload1.single("input1"), (req, res) => {

  decompressFile(
    "./uploads/input.txt",
    "./uploads/compress.bin",
    "./uploads/decompress.txt"
  );
  res.redirect("/downloadfiled");
});
app.get("/download", (req, res) => {
  // console.log();
  res.render("download");
});

app.listen(5000, () => {
  console.log("server is running at port no 5000\nvisit: http://localhost:5000");
});
