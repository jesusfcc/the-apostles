import Irys from "@irys/sdk";

let _irys: InstanceType<typeof Irys> | null = null;

async function getIrys(): Promise<InstanceType<typeof Irys>> {
  if (!_irys) {
    const privateKey = process.env.ARWEAVE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("ARWEAVE_PRIVATE_KEY environment variable not configured");
    }

    _irys = new Irys({
      url: "https://node2.irys.xyz",
      token: "base-eth",
      key: privateKey,
    });
  }
  return _irys;
}

/**
 * Upload binary data (e.g. image buffer) to Arweave via Irys.
 * Returns the permanent Arweave gateway URL.
 */
export async function uploadToArweave(
  data: Buffer,
  contentType: string
): Promise<string> {
  const irys = await getIrys();
  const receipt = await irys.upload(data, {
    tags: [{ name: "Content-Type", value: contentType }],
  });
  return `https://arweave.net/${receipt.id}`;
}

/**
 * Upload a JSON object to Arweave via Irys.
 * Returns the permanent Arweave gateway URL.
 */
export async function uploadJsonToArweave(json: object): Promise<string> {
  const irys = await getIrys();
  const data = JSON.stringify(json);
  const receipt = await irys.upload(data, {
    tags: [{ name: "Content-Type", value: "application/json" }],
  });
  return `https://arweave.net/${receipt.id}`;
}
