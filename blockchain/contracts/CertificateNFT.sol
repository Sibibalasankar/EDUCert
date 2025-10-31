// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Certificate {
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

    mapping(uint256 => Certificate) public certificates;
    mapping(string => uint256) public registerNumberToTokenId;
    mapping(address => bool) public collegeAuthorities;

    event CertificateMinted(uint256 indexed tokenId, address indexed studentAddress, string registerNumber, string ipfsHash);
    event CertificateRevoked(uint256 indexed tokenId);

    constructor() ERC721("Academic Certificate NFT", "ACERT") {
        collegeAuthorities[msg.sender] = true;
    }

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
    ) external returns (uint256) {
        require(collegeAuthorities[msg.sender], "Not authorized");
        require(registerNumberToTokenId[registerNumber] == 0, "Certificate already exists for this register number");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        certificates[tokenId] = Certificate({
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

        registerNumberToTokenId[registerNumber] = tokenId;
        _mint(studentAddress, tokenId);

        emit CertificateMinted(tokenId, studentAddress, registerNumber, ipfsHash);
        return tokenId;
    }

    // Get total number of certificates
    function getTotalCertificates() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Get certificate by token ID
    function getCertificate(uint256 tokenId) public view returns (
        string memory studentName,
        string memory registerNumber,
        string memory course,
        string memory degree,
        string memory cgpa,
        string memory certificateType,
        uint256 issueDate,
        string memory ipfsHash,
        string memory department,
        string memory batch,
        uint256 yearOfPassing,
        bool isRevoked
    ) {
        require(_exists(tokenId), "Certificate does not exist");
        Certificate memory cert = certificates[tokenId];
        
        return (
            cert.studentName,
            cert.registerNumber,
            cert.course,
            cert.degree,
            cert.cgpa,
            cert.certificateType,
            cert.issueDate,
            cert.ipfsHash,
            cert.department,
            cert.batch,
            cert.yearOfPassing,
            cert.isRevoked
        );
    }

    // Get certificate by register number
    function getCertificateByRegisterNumber(string memory registerNumber) public view returns (
        string memory studentName,
        string memory registerNumber_,
        string memory course,
        string memory degree,
        string memory cgpa,
        string memory certificateType,
        uint256 issueDate,
        string memory ipfsHash,
        string memory department,
        string memory batch,
        uint256 yearOfPassing,
        bool isRevoked
    ) {
        uint256 tokenId = registerNumberToTokenId[registerNumber];
        require(tokenId != 0, "Certificate not found for this register number");
        
        return getCertificate(tokenId);
    }

    // Verify certificate validity
    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId) && !certificates[tokenId].isRevoked;
    }

    // Revoke certificate
    function revokeCertificate(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Certificate does not exist");
        certificates[tokenId].isRevoked = true;
        emit CertificateRevoked(tokenId);
    }

    // Add college authority
    function addCollegeAuthority(address authority) external onlyOwner {
        collegeAuthorities[authority] = true;
    }

    // Check if certificate exists for register number
    function certificateExists(string memory registerNumber) public view returns (bool) {
        return registerNumberToTokenId[registerNumber] != 0;
    }

    // Get token ID by register number
    function getTokenIdByRegisterNumber(string memory registerNumber) public view returns (uint256) {
        return registerNumberToTokenId[registerNumber];
    }
}