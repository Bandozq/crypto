import { MetaMaskSDK } from '@metamask/sdk';
import { ethers } from 'ethers';

// MetaMask SDK Integration
export class WalletIntegration {
  private metamaskSDK: MetaMaskSDK | null = null;
  private provider: any = null;
  private signer: any = null;
  
  constructor() {
    this.initializeMetaMask();
  }

  private initializeMetaMask() {
    try {
      this.metamaskSDK = new MetaMaskSDK({
        dappMetadata: {
          name: "P2E Games & Airdrops Dashboard",
          url: window.location.href,
        },
        infuraAPIKey: undefined, // Add your Infura key if needed
      });
    } catch (error) {
      console.error('Failed to initialize MetaMask SDK:', error);
    }
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<{ success: boolean; address?: string; balance?: string; error?: string }> {
    try {
      if (!this.metamaskSDK) {
        return { success: false, error: 'MetaMask SDK not initialized' };
      }

      // Request account access
      const accounts = await this.metamaskSDK.connect();
      
      if (!accounts || accounts.length === 0) {
        return { success: false, error: 'No accounts found' };
      }

      // Get provider and signer
      this.provider = this.metamaskSDK.getProvider();
      const ethersProvider = new ethers.BrowserProvider(this.provider);
      this.signer = await ethersProvider.getSigner();
      
      const address = accounts[0];
      const balance = await ethersProvider.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);

      return {
        success: true,
        address,
        balance: balanceInEth
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to MetaMask'
      };
    }
  }

  // Connect to Trust Wallet (via WalletConnect)
  async connectTrustWallet(): Promise<{ success: boolean; address?: string; balance?: string; error?: string }> {
    try {
      // Check if Trust Wallet is available
      if (typeof window !== 'undefined' && (window as any).trustwallet) {
        const trustwallet = (window as any).trustwallet;
        
        const accounts = await trustwallet.request({
          method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
          return { success: false, error: 'No accounts found in Trust Wallet' };
        }

        const provider = new ethers.BrowserProvider(trustwallet);
        const balance = await provider.getBalance(accounts[0]);
        const balanceInEth = ethers.formatEther(balance);

        return {
          success: true,
          address: accounts[0],
          balance: balanceInEth
        };
      } else {
        return {
          success: false,
          error: 'Trust Wallet not detected. Please install Trust Wallet mobile app or browser extension.'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Trust Wallet'
      };
    }
  }

  // Get token balances for connected wallet
  async getTokenBalances(address: string): Promise<Array<{ symbol: string; balance: string; value: number }>> {
    try {
      if (!this.provider) {
        throw new Error('No wallet connected');
      }

      const ethersProvider = new ethers.BrowserProvider(this.provider);
      
      // Get ETH balance
      const ethBalance = await ethersProvider.getBalance(address);
      const ethBalanceFormatted = ethers.formatEther(ethBalance);
      
      // For demo, we'll return ETH balance and simulate some common tokens
      // In production, you'd query token contracts or use services like Alchemy/Moralis
      const tokens = [
        {
          symbol: 'ETH',
          balance: ethBalanceFormatted,
          value: parseFloat(ethBalanceFormatted) * 2500 // Mock ETH price
        },
        // Add more tokens here by querying their contract addresses
      ];

      return tokens;
    } catch (error) {
      console.error('Failed to get token balances:', error);
      return [];
    }
  }

  // Get transaction history
  async getTransactionHistory(address: string, limit: number = 10): Promise<Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
  }>> {
    try {
      if (!this.provider) {
        throw new Error('No wallet connected');
      }

      const ethersProvider = new ethers.BrowserProvider(this.provider);
      
      // Get latest block number
      const latestBlock = await ethersProvider.getBlockNumber();
      
      // Search recent blocks for transactions
      const transactions = [];
      let count = 0;
      
      for (let i = latestBlock; i > latestBlock - 100 && count < limit; i--) {
        try {
          const block = await ethersProvider.getBlock(i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'object' && (tx.from === address || tx.to === address)) {
                transactions.push({
                  hash: tx.hash,
                  from: tx.from || '',
                  to: tx.to || '',
                  value: ethers.formatEther(tx.value || '0'),
                  timestamp: block.timestamp
                });
                count++;
                if (count >= limit) break;
              }
            }
          }
        } catch (blockError) {
          // Skip blocks that can't be fetched
          continue;
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  // Disconnect wallet
  disconnect(): void {
    this.provider = null;
    this.signer = null;
    if (this.metamaskSDK) {
      this.metamaskSDK.terminate();
    }
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.provider !== null;
  }

  // Get current provider
  getProvider() {
    return this.provider;
  }

  // Get current signer
  getSigner() {
    return this.signer;
  }
}

// Export singleton instance
export const walletIntegration = new WalletIntegration();
