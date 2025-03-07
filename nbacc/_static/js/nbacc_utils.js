async function readGzJson(url) {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const decompressed = pako.inflate(uint8Array, { to: "string" });
        const jsonData = JSON.parse(decompressed);
        return jsonData;
    } catch (error) {
        console.error("Error reading or parsing gzipped JSON:", error);
        throw error;
    }
}
