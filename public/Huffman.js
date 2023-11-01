// huffman
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

  const nodes = Array.from(
    charFrequency,
    ([char, freq]) => new Node(char, freq)
  );

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

function encodeTextToBytes(text, codes) {
  let encodedText = "";
  for (let char of text) {
    encodedText += codes[char];
  }

  const byteLength = Math.ceil(encodedText.length / 8);
  const bytes = new Uint8Array(byteLength);

  for (let i = 0; i < encodedText.length; i++) {
    if (encodedText[i] === "1") {
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
  const text = fs.readFileSync(inputFileName, "utf-8");
  const huffmanTree = buildHuffmanTree(text);
  rt = huffmanTree;
  const huffmanCodes = generateHuffmanCodes(huffmanTree);
  //   console.log(rt);
  const encodedText = encodeTextToBytes(text, huffmanCodes);
  writeBinaryFile(outputFileName, encodedText);
}

function readBinaryFile(fileName) {
  return fs.readFileSync(fileName);
}

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
