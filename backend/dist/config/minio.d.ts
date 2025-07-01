import { Client } from 'minio';
declare let minioClient: Client | null;
declare const BUCKET_NAME = "ai-detector-files";
export declare function setupMinIO(): Promise<void>;
export { minioClient, BUCKET_NAME };
//# sourceMappingURL=minio.d.ts.map