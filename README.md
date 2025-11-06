# EDUCert

EDUCert is a decentralized certificate issuance and verification platform that combines a MongoDB-backed admin/student portal with NFT-based certificate minting on Ethereum (Sepolia). Institution admins can insert/update/delete student records, approve specific certificates (semester marksheets, provisional, degree, etc.), and students can connect a wallet to view approved certificates and mint them as NFTs. Anyone (institutions, recruiters) can verify minted certificates by register number, token ID, or transaction hash without connecting a wallet.

---

## Table of Contents
- Project overview
- Features
- Architecture
- Prerequisites
- Environment variables
- Installation & setup (Windows)
- Running the app
- Smart contract: compile & deploy
- API reference (selected endpoints)
- Data model (Student)
- Typical flows
  - Admin: approve certificate
  - Student: view & mint certificate
  - Verification: public lookup
- Security & notes
- Testing
- Contributing
- License

---

## Project overview
- Backend: Node.js + Express + Mongoose (MongoDB)
- Frontend: React (wallet integration via web3/ethers)
- Blockchain: ERC-721 NFT contract for certificate minting (owner-only minting from backend)
- Storage: IPFS (or any chosen off-chain storage) for certificate files/hashes (ipfsHash stored in DB & contract)
- Network: Sepolia testnet (configurable)

Repository root: d:\educert

Typical folder layout (may vary by repo):
- d:\educert\backend
- d:\educert\frontend
- d:\educert\contracts (or smart-contract folder)
- d:\educert\scripts

---

## Features
- Admin CRUD for students (insert, update, delete)
- Admin approval of individual certificates (semester marks, provisional, degree)
- Student wallet connection to fetch approved certificates by wallet address
- Mint approved certificates as NFTs to student's wallet (backend signs transaction with ADMIN_PRIVATE_KEY)
- Public verification portal (no wallet required) to search by register no, token id, or tx hash
- MongoDB tracks statuses: pending → approved → minted

---

## Prerequisites
- Windows 10/11
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB Atlas (or self-hosted MongoDB)
- Infura or Alchemy project for Ethereum Sepolia RPC (or other JSON-RPC provider)
- MetaMask or similar wallet for frontend testing
- Hardhat or Truffle (if contracts are present and need deployment)

---

## Environment variables
Create a `.env` file in `d:\educert\backend` (do NOT commit this file). Use `.env.example` locally with no secrets.

Required variables (names only — do not paste secrets into source control):
- MONGODB_URI
- SEPOLIA_RPC_URL
- ADMIN_PRIVATE_KEY
- JWT_SECRET
- PORT (optional, default 3001)

Example `.env.example` (place in repo for developers):
```
MONGODB_URI=your-mongodb-connection-string
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_ID
ADMIN_PRIVATE_KEY=0xYOUR_ADMIN_PRIVATE_KEY
JWT_SECRET=some_secure_jwt_secret
PORT=3001
```

---

## Installation & setup (Windows)
Open PowerShell or Command Prompt.

1. Clone repository
   - git clone https://github.com/Sibibalasankar/EDUCert.git d:\educert
   - cd d:\educert

2. Backend
   - cd d:\educert\backend
   - npm install
   - Copy `.env.example` → `.env` and fill in values

3. Frontend
   - cd d:\educert\frontend
   - npm install

4. (Optional) Contracts
   - cd d:\educert\contracts (or folder where contracts live)
   - npm install (if using Hardhat/Truffle)
   - configure network in hardhat.config.js or truffle-config.js

---

## Running the app (Windows commands)
Backend (development):
- cd d:\educert\backend
- npm run dev
  - (or) npx nodemon src/index.js

Frontend (development):
- cd d:\educert\frontend
- npm start

Open browser:
- Frontend UI: http://localhost:3000 (or configured port)
- Backend API: http://localhost:3001 (or configured PORT)

---

## Smart contract: compile & deploy (Hardhat example)
1. Install Hardhat in contracts folder (if not present):
   - cd d:\educert\contracts
   - npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers

2. Compile & deploy (Sepolia)
   - Configure `SEPOLIA_RPC_URL` & `ADMIN_PRIVATE_KEY` in `.env`
   - npx hardhat run scripts/deploy.js --network sepolia

3. After deploy:
   - Copy deployed contract address & ABI to backend config (e.g., `backend/config/contract.json` or `.env` var)

Example deploy command:
- npx hardhat run .\scripts\deploy.js --network sepolia

Note: Backend must have contract address & ABI to call `mintCertificate`.

---

## Selected API endpoints (examples)
Note: adjust paths to actual routes in your backend implementation.

- Admin: Approve certificate
  - POST /api/admin/approve
  - Body: { "registerNumber": "REG123", "certificateType": "SEM1" }

- Student: Get student by wallet
  - GET /api/student/wallet/:walletAddress

- Student: Mint certificate (backend mints via ADMIN_PRIVATE_KEY)
  - POST /api/student/mint
  - Body: { "registerNumber": "REG123", "certificateType": "DEGREE", "walletAddress": "0x..." }

- Verification: public search
  - GET /api/verify/register/:registerNumber
  - GET /api/verify/token/:tokenId
  - GET /api/verify/tx/:transactionHash

Example curl (mint):
```
curl -X POST http://localhost:3001/api/student/mint \
  -H "Content-Type: application/json" \
  -d '{"registerNumber":"REG123","certificateType":"DEGREE","walletAddress":"0xabc..."}'
```

---

## Data model (Student) — high level
Student document example:
```
{
  registerNumber: "REG123",
  name: "Alice Example",
  walletAddress: "0xabc...",
  department: "CSE",
  email: "alice@example.edu",
  certificates: [
    {
      type: "SEM1",
      status: "APPROVED",   // PENDING | APPROVED | MINTED
      ipfsHash: "Qm...",
      tokenId: "1",
      transactionHash: "0x...",
      approvedAt: "2025-11-01T...",
      mintedAt: "2025-11-02T..."
    },
    ...
  ]
}
```

---

## Typical flows

1. Admin flow
   - Login (admin auth — ensure JWT or session)
   - Create/Update/Delete student records
   - Approve a specific certificate for a student (sets certificate.status = APPROVED and records approvedAt)

2. Student flow
   - Connect wallet in frontend (MetaMask)
   - Frontend fetches student by wallet address: GET /api/student/wallet/:address
   - View list of approved but unminted certificates
   - Click "Mint": frontend calls POST /api/student/mint -> backend calls contract.mintCertificate(...), waits for tx, updates DB with tokenId, tx hash and sets status = MINTED

3. Verification
   - Anyone can go to verification page and search by register number / token id / tx hash
   - If certificate is minted, display certificate metadata, link to transaction on Sepolia explorer, and IPFS file if available

---

## Security & best practices
- NEVER commit `.env` or private keys. Use environment-specific secret management.
- Use a dedicated admin key with minimum required permissions; consider a hardware wallet or multisig for production.
- Add authentication & role-based access control for admin routes (JWT + secure passwords).
- Validate and sanitize all inputs.
- Add rate limiting on public verification endpoints.
- Keep node & dependency versions up to date.
- For production, serve via HTTPS and consider CORS policies for the frontend.

---

## Testing
- Unit tests: add tests in backend (Jest / Mocha) for controllers and models
- Contract tests: use Hardhat/Truffle + mocha to test contract logic
- Integration: test full mint flow on Sepolia before mainnet
- Example command (if tests exist):
  - cd d:\educert\backend
  - npm test

---

## Troubleshooting
- DB connection issues: verify MONGODB_URI and network access (IP whitelist in Atlas).
- RPC issues: ensure SEPOLIA_RPC_URL is valid (Infura/Alchemy) and funded admin account for gas.
- Contract calls failing: confirm contract address & ABI in backend match deployed contract.

---

## Contributing
- Fork the repo, create a feature branch, open a PR with description & tests.
- Add `.env.example` entries for new required env vars.
- Keep commits atomic and descriptive.

---

## License
- Include the appropriate LICENSE file in the repo. If none exists, add one (MIT recommended for open-source).

---

If you want, I can:
- Generate a `.env.example` file
- Create a sample `scripts/deploy.js` Hardhat deploy script
- Produce OpenAPI/Swagger for the backend routes
- Generate a short admin & student UI checklist and example components

Specify which of the above you'd like next.