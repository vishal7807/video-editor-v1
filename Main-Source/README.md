This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
Make sure you are in frontend directory
```bash
cd frontend
```
Install necessary node packages
```bash
npm install
# or
npm i
```

# Create .env.local file
```bash
cp .env.example .env.local
```

# Edit .env.local with:
NEXT_PUBLIC_USE_MOCK="true"
NEXT_PUBLIC_API_URL=http://localhost:8000
```
To run the development server:
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
