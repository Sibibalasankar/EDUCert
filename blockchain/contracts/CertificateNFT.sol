// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CertificateNFT
 * @dev NFT contract for issuing educational certificates on blockchain
 */
contract CertificateNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;

    // Certificate metadata structure
    struct CertificateMetadata {
        string studentName;
        string registerNumber;
        string course;
        string degree;
        string cgpa;
        string certificateType;
        uint256 issueDate;
        string ipfsHash;
        string department;
        string batch;
        uint256 yearOfPassing;
        bool isRevoked;
    }

    // Mapping from token ID to certificate metadata
    mapping(uint256 => CertificateMetadata) public certificates;

    // Mapping from register number to token ID (to prevent duplicates)
    mapping(string => uint256) public registerNumberToTokenId;

    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed studentAddress,
        string registerNumber,
        string ipfsHash
    );

    event CertificateRevoked(
        uint256 indexed tokenId,
        string reason
    );

    // College authorities who can mint certificates
    mapping(address => bool) public collegeAuthorities;

    modifier onlyCollegeAuthority() {
        require(collegeAuthorities[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() ERC721("EduCert", "EDUCT") {
        // Add contract deployer as college authority
        collegeAuthorities[msg.sender] = true;
    }

    /**
     * @dev Mint a new certificate NFT
     */
    function mintCertificate(
        address studentAddress,
        string memory studentName,
        string memory registerNumber,
        string memory course,
        string memory degree,
        string memory cgpa,
        string memory certificateType,
        string memory ipfsHash,
        string memory department,
        string memory batch,
        uint256 yearOfPassing
    ) public onlyCollegeAuthority returns (uint256) {
        // Check if certificate already exists for this register number
        require(registerNumberToTokenId[registerNumber] == 0, "Certificate already exists");

        // Increment token ID
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        // Mint NFT to student
        _safeMint(studentAddress, newTokenId);

        // Store certificate metadata
        certificates[newTokenId] = CertificateMetadata({
            studentName: studentName,
            registerNumber: registerNumber,
            course: course,
            degree: degree,
            cgpa: cgpa,
            certificateType: certificateType,
            issueDate: block.timestamp,
            ipfsHash: ipfsHash,
            department: department,
            batch: batch,
            yearOfPassing: yearOfPassing,
            isRevoked: false
        });

        // Map register number to token ID
        registerNumberToTokenId[registerNumber] = newTokenId;

        // Emit event
        emit CertificateMinted(newTokenId, studentAddress, registerNumber, ipfsHash);

        return newTokenId;
    }

    /**
     * @dev Get certificate metadata by token ID
     */
    function getCertificate(uint256 tokenId) public view returns (CertificateMetadata memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }

    /**
     * @dev Get certificate by register number
     */
    function getCertificateByRegisterNumber(string memory registerNumber) public view returns (CertificateMetadata memory) {
        uint256 tokenId = registerNumberToTokenId[registerNumber];
        require(tokenId != 0, "Certificate not found");
        return getCertificate(tokenId);
    }

    /**
     * @dev Verify certificate authenticity
     */
    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        CertificateMetadata memory cert = certificates[tokenId];
        return !cert.isRevoked;
    }

    /**
     * @dev Revoke a certificate (only in case of fraud)
     */
    function revokeCertificate(uint256 tokenId, string memory reason) public onlyCollegeAuthority {
        require(_exists(tokenId), "Certificate does not exist");
        require(!certificates[tokenId].isRevoked, "Certificate already revoked");
        
        certificates[tokenId].isRevoked = true;
        emit CertificateRevoked(tokenId, reason);
    }

    /**
     * @dev Add college authority
     */
    function addCollegeAuthority(address authority) public onlyOwner {
        collegeAuthorities[authority] = true;
    }

    /**
     * @dev Remove college authority
     */
    function removeCollegeAuthority(address authority) public onlyOwner {
        collegeAuthorities[authority] = false;
    }

    /**
     * @dev Get total certificates minted
     */
    function getTotalCertificates() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Override tokenURI to return IPFS link
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        
        string memory ipfsHash = certificates[tokenId].ipfsHash;
        return string(abi.encodePacked("ipfs://", ipfsHash));
    }
}