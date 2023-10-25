const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const app = express();

//huffman

class HuffmanNode {
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

function buildHuffmanTree(freqMap) {
  const heap = Object.keys(freqMap).map(
    (char) => new HuffmanNode(char, freqMap[char])
  );

  while (heap.length > 1) {
    heap.sort((a, b) => a.freq - b.freq);
    const left = heap.shift();
    const right = heap.shift();
    const merged = new HuffmanNode(null, left.freq + right.freq);
    merged.left = left;
    merged.right = right;
    heap.push(merged);
  }

  return heap[0];
}

function buildHuffmanCodes(root, currentCode, huffmanCodes) {
  if (!root) return;

  if (root.char) {
    huffmanCodes[root.char] = currentCode;
    return;
  }

  buildHuffmanCodes(root.left, currentCode + "0", huffmanCodes);
  buildHuffmanCodes(root.right, currentCode + "1", huffmanCodes);
}
let root;
let text;
function readit(inputFile) {
  text = fs.readFileSync(inputFile, "utf8");
  const frequencyMap = {};

  for (const char of text) {
    frequencyMap[char] = (frequencyMap[char] || 0) + 1;
  }

  root = buildHuffmanTree(frequencyMap);
}

function compressFile(inputFile, outputFile) {
  // const text = fs.readFileSync(inputFile, 'utf8');
  // const frequencyMap = {};

  // for (const char of text) {
  //     frequencyMap[char] = (frequencyMap[char] || 0) + 1;
  // }

  // root = buildHuffmanTree(frequencyMap);
  readit(inputFile);
  const huffmanCodes = {};
  buildHuffmanCodes(root, "", huffmanCodes);

  const encodedText = Array.from(text)
    .map((char) => huffmanCodes[char])
    .join("");

  fs.writeFileSync(outputFile, encodedText, "utf8");
}

function decompressFile(ipfile,inputFile, outputFile) {
    readit(ipfile);
  const encodedText = fs.readFileSync(inputFile, "utf8");
  let current = root;
  const decodedText = [];

  for (const bit of encodedText) {
    if (bit === "0") {
      current = current.left;
    } else {
      current = current.right;
    }

    if (current.char !== null) {
      decodedText.push(current.char);
      current = root;
    }
  }

  const decodedTextString = decodedText.join("");
  fs.writeFileSync(outputFile, decodedTextString, "utf8");
}


//finish



app.use(express.json());
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

const upload = multer({ storage: storage });


app.get("/", (req, res) => {
  res.status(200).render("Mainpage");
});
app.get("/compress", (req, res) => {
    res.status(200).render("compress");
  });
  app.get("/dcompress", (req, res) => {
    res.status(200).render("decompress");
  });
// j
app.post("/cupload", upload.single("input"), (req, res) => {
// console.log(req.file);
compressFile('./uploads/input.txt',"./uploads/compress.txt");
res.redirect('/')
});
app.post("/dupload", upload.single("input1"), (req, res) => {
  // console.log(req.file);
  decompressFile('./uploads/input.txt','./uploads/compress.txt',"./uploads/decompress.txt");
  res.redirect('/')
  });
app.get("/download", (req, res) => {
  // console.log(req.file);
  res.render("downloas")
  });

app.listen(5000, () => {
  console.log("listening at 5000");
});
