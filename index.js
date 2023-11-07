//importing needful node packages
const express = require("express"); //express.js
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const app = express();
var favicon = require("serve-favicon");//to show favicon in the browser

// huffman coding algorithm for file compression and de-compression
class Node {
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}
let rt;  //global variable to hold the root of the hoffman tree

//function to build hoffman tree from a text
function buildHuffmanTree(text) {
  const charFrequency = new Map(); //hashmap to store frequency along with character as a key
  for (let char of text) {  //counting frequencies
    if (charFrequency.has(char)) {
      charFrequency.set(char, charFrequency.get(char) + 1);
    } else {
      charFrequency.set(char, 1);
    }
  }

//creating hoffman tree nodes
  const nodes = Array.from(
    charFrequency,
    ([char, freq]) => new Node(char, freq)
  );

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq); //sorting nodes(char) by frequencies
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new Node(null, left.freq + right.freq);
    parent.left = left;
    parent.right = right;
    nodes.push(parent);
  }

  return nodes[0]; //returning the root for the tree
}
//generating codes for characters
function generateHuffmanCodes(root, prefix = "", codes = {}) {
  if (root) {
    if (root.char !== null) {
      codes[root.char] = prefix;
    }
    generateHuffmanCodes(root.left, prefix + "0", codes);
    generateHuffmanCodes(root.right, prefix + "1", codes);
  }
  return codes;
}
//encoding it to byteds to reduce file size
function encodeTextToBytes(text, codes) {
  let encodedText = "";
  for (let char of text) {
    encodedText += codes[char];
  }

  const byteLength = Math.ceil(encodedText.length / 8);
  const bytes = new Uint8Array(byteLength);//byte array

  for (let i = 0; i < encodedText.length; i++) {
    if (encodedText[i] === "1") {
      const byteIndex = Math.floor(i / 8);
      const bitOffset = 7 - (i % 8);
      bytes[byteIndex] |= 1 << bitOffset;
    }
  }

  return bytes;
}
//writing the byte array to a .bin file 
function writeBinaryFile(fileName, data) {
  fs.writeFileSync(fileName, data);
}


//function for compress the text
function compressText(inputFileName, outputFileName) {
  const text = fs.readFileSync(inputFileName, "utf-8");
  const huffmanTree = buildHuffmanTree(text);
  rt = huffmanTree;
  const huffmanCodes = generateHuffmanCodes(huffmanTree);
  //   console.log(rt);
  const encodedText = encodeTextToBytes(text, huffmanCodes);
  writeBinaryFile(outputFileName, encodedText);
}
//reading binary file 
function readBinaryFile(fileName) {
  return fs.readFileSync(fileName);
}
//decoding the bytes to text (bytes to 1 0 s)
function decodeBytesToText(bytes, huffmanTree) {
  let decodedText = "";
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
//decompres the file 
function decompressFile(input, inputFileName, outputFileName) {
  const text = fs.readFileSync(input, "utf-8");
  rt = buildHuffmanTree(text);
  const encodedBytes = readBinaryFile(inputFileName);

  const huffmanTree = buildHuffmanTree(encodedBytes.toString("utf-8"));
  // console.log(huffmanTree,"\n",rt);
  const decodedText = decodeBytesToText(encodedBytes, rt);

  let newStr = decodedText.slice(0, -1);
  // console.log(newStr);
  fs.writeFileSync(outputFileName, newStr, "utf-8");
}

// finish

app.use(express.json());

app.use(express.static(path.join(__dirname, "public"))); //seting express static path to public
app.use(favicon(path.join(__dirname, "public", "favicon.ico"))); //seting favicon
app.use(express.urlencoded({ extended: false })); //middleware to use encoded text
app.set("view engine", "ejs"); //setting ejs as view engine
app.set("views", "./view"); //seting default path for view engine
//configuring multer npm package to store uploaded file 
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
app.use(express.static(path.join(__dirname, "view")));

const upload = multer({ storage: storage });//multer storage for compression
const upload1 = multer({ storage: storage1 }); //multer storage for de-compression

//home page route
app.get("/", (req, res) => {
  res.status(200).render("Home");
});

//about page route
app.get("/about", (req, res) => {
  res.status(200).render("about");
});

//manual page route
app.get("/manual", (req, res) => {
  res.status(200).render("manual");
});

//compression route
app.get("/compress", (req, res) => {
  res.status(200).render("compress");
});

//de-compression route
app.get("/dcompress", (req, res) => {
  res.status(200).render("decompress");
});

//compress file download route
app.get("/downloadfilec", (req, res) => {
  const filePath = path.join(__dirname, "uploads/compress.bin");
  res.download(filePath);
});

//de-compress file download route
app.get("/downloadfiled", (req, res) => {
  const filePath = path.join(__dirname, "uploads/decompress.txt");
  res.download(filePath);
});

//route to compressa uploaded file
app.post("/cupload", upload.single("input"), (req, res) => {
  compressText("./uploads/input.txt", "./uploads/compress.bin");
  res.redirect("/downloadfilec");
});

//route to de-compress a uploaded file
app.post("/dupload", upload1.single("input1"), (req, res) => {
  decompressFile(
    "./uploads/input.txt",
    "./uploads/compress.bin",
    "./uploads/decompress.txt"
  );
  res.redirect("/downloadfiled");
});


// app.get("/download", (req, res) => {
//   // console.log();
//   res.render("download");
// });

//staring application at port 5000
app.listen(5000, () => {
  console.log(
    "server is running at port no 5000\nvisit: http://localhost:5000"
  );
});
