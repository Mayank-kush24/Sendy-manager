# Sendy-Upload-API
H2S Sendy Upload API Service for UTS

## Performance Features

This application includes advanced performance optimizations for CSV upload processing:

- **Concurrent Processing**: Configurable concurrent request limits (default: 6) using `p-limit` for optimal throughput
- **Web Worker Support**: CSV parsing runs in a Web Worker to prevent UI blocking
- **Retry Logic**: Automatic retry with exponential backoff for failed requests (3 attempts by default)
- **Rate Limiting**: Configurable delays between batches to prevent API throttling
- **Upload Resume**: Ability to pause and resume uploads, with automatic progress persistence
- **Progress Tracking**: Real-time progress with ETA, upload speed (rows/sec, MB/s), and latency metrics
- **Error Handling**: Comprehensive error tracking with export functionality for failed rows
- **Memory Optimization**: Streaming processing with immediate cleanup of processed batches

## Configuration

Create a `.env.local` file (see `.env.example`) to configure:

- `NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS`: Maximum concurrent API requests (default: 6)
- `NEXT_PUBLIC_BATCH_SIZE`: Batch size for processing (default: 20)
- `NEXT_PUBLIC_RETRY_ATTEMPTS`: Number of retry attempts (default: 3)
- `NEXT_PUBLIC_BATCH_DELAY_MS`: Delay between batches in milliseconds (default: 100)
- `NEXT_PUBLIC_REQUEST_TIMEOUT_MS`: Request timeout in milliseconds (default: 30000)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
