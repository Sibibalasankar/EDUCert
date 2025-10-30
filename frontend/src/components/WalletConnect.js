import React from 'react';
import { useWeb3 } from '../context/Web3Context';

const WalletConnect = () => {
  const { isConnected, connectWallet, account } = useWeb3();

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
    >
      Connect Wallet
    </button>
  );
};

export default WalletConnect;