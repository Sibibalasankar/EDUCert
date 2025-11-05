// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CertificateNFT is ERC721Enumerable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdCounter;

    struct Certificate {
        string studentId;
        string certificateType;
        uint256 issueDate;
        string ipfsHash;
        bool isRevoked;
    }

    // Mapping from token ID to certificate details
    mapping(uint256 => Certificate) public certificateDetails;

    // Mapping from student address to eligibility status
    mapping(address => bool) public isEligibleToMint;
    
    // Mapping from student address to IPFS hash for minting
    mapping(address => string) public eligibilityIpfsHash;

    // Mapping from student address to studentId
    mapping(address => string) public eligibilityStudentId;

    // Mapping from student address to certificateType
    mapping(address => string) public eligibilityCertificateType;

    // Mapping to check if a student has already minted
    mapping(address => bool) public hasMinted;

    event CertificateApproved(
        address indexed studentAddress,
        string studentId,
        string certificateType,
        string ipfsHash
    );
    
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string studentId,
        string ipfsHash
    );

    event CertificateRevoked(uint256 indexed tokenId);

    constructor() ERC721("EduCert NFT", "EDUC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function approveCertificate(
        address studentAddress,
        string memory studentId,
        string memory certificateType,
        string memory ipfsHash
    ) external onlyRole(MINTER_ROLE) {
        require(studentAddress != address(0), "Invalid student address");
        require(!hasMinted[studentAddress], "Student has already minted a certificate");
        
        isEligibleToMint[studentAddress] = true;
        eligibilityIpfsHash[studentAddress] = ipfsHash;
        eligibilityStudentId[studentAddress] = studentId;
        eligibilityCertificateType[studentAddress] = certificateType;

        emit CertificateApproved(studentAddress, studentId, certificateType, ipfsHash);
    }

    function mintCertificate() external {
        require(isEligibleToMint[msg.sender], "You are not eligible to mint");
        require(!hasMinted[msg.sender], "You have already minted your certificate");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(msg.sender, tokenId);

        certificateDetails[tokenId] = Certificate({
            studentId: eligibilityStudentId[msg.sender],
            certificateType: eligibilityCertificateType[msg.sender],
            issueDate: block.timestamp,
            ipfsHash: eligibilityIpfsHash[msg.sender],
            isRevoked: false
        });

        // Update status
        hasMinted[msg.sender] = true;
        isEligibleToMint[msg.sender] = false; // One-time mint

        emit CertificateMinted(tokenId, msg.sender, eligibilityStudentId[msg.sender], eligibilityIpfsHash[msg.sender]);
    }

    function revokeCertificate(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "Certificate does not exist");
        
        // Mark as revoked and burn
        certificateDetails[tokenId].isRevoked = true;
        _burn(tokenId);

        emit CertificateRevoked(tokenId);
    }

    function getCertificateDetails(uint256 tokenId) external view returns (Certificate memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificateDetails[tokenId];
    }

    function getOwnedCertificates(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokens;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}