const axios = require('axios');
const FormData = require('form-data');

class IPFSUtil {
  constructor() {
    // Using Pinata as IPFS service provider
    this.pinataApiKey = process.env.PINATA_API_KEY || 'your-pinata-api-key';
    this.pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY || 'your-pinata-secret-key';
    this.pinataUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    
    // Fallback to local IPFS node if Pinata fails
    this.localIpfsUrl = process.env.IPFS_NODE_URL || 'http://localhost:5001/api/v0';
  }

  async uploadToIPFS(data) {
    try {
      // Try uploading to Pinata first
      const response = await axios.post(
        this.pinataUrl,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretApiKey
          }
        }
      );
      
      return response.data.IpfsHash;
    } catch (error) {
      console.log('Pinata upload failed, falling back to local IPFS node');
      
      // Fallback to local IPFS node
      try {
        // For local IPFS node, we need to use FormData
        const formData = new FormData();
        formData.append('file', JSON.stringify(data));
        
        const response = await axios.post(
          `${this.localIpfsUrl}/add`,
          formData,
          {
            headers: {
              ...formData.getHeaders()
            }
          }
        );
        
        return response.data.Hash;
      } catch (localError) {
        console.error('Local IPFS upload failed:', localError);
        
        // Instead of generating a mock hash, throw an error to be handled by the caller
        throw new Error('Failed to upload to IPFS: Both Pinata and local node failed');
      }
    }
  }

  async getFromIPFS(hash) {
    try {
      // Try getting from Pinata gateway
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`);
      return response.data;
    } catch (error) {
      console.log('Pinata gateway failed, falling back to local IPFS node');
      
      // Fallback to local IPFS node
      try {
        const response = await axios.get(`${this.localIpfsUrl}/cat?arg=${hash}`);
        return response.data;
      } catch (localError) {
        console.error('Local IPFS retrieval failed:', localError);
        throw new Error('Failed to retrieve from IPFS');
      }
    }
  }
}

module.exports = new IPFSUtil();