// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EDUCert is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct Certificate {
        string studentId;
        string studentName;
        string courseName;
        string grade;
        string ipfsHash;
        uint256 issueDate;
        address mintedBy;
        bool isMinted;
    }
    
    struct StudentEligibility {
        bool isEligible;
        string studentId;
        string studentName;
        string courseName;
        string grade;
        string ipfsHash;
        bool hasMinted;
    }
    
    // Mappings
    mapping(string => Certificate) public certificates;
    mapping(string => StudentEligibility) public studentEligibility;
    mapping(address => string) public studentAddressToId;
    
    // Events
    event StudentAllowed(
        string indexed studentId,
        string studentName,
        string courseName,
        string grade,
        string ipfsHash
    );
    
    event CertificateMinted(
        string indexed studentId,
        address mintedBy,
        uint256 issueDate,
        string ipfsHash
    );
    
    event StudentRevoked(string indexed studentId);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // ADMIN: Allow student to mint certificate
    function allowStudentToMint(
        string memory _studentId,
        string memory _studentName,
        string memory _courseName,
        string memory _grade,
        string memory _ipfsHash
    ) external onlyRole(ADMIN_ROLE) {
        require(!studentEligibility[_studentId].isEligible, "Student already eligible");
        
        studentEligibility[_studentId] = StudentEligibility({
            isEligible: true,
            studentId: _studentId,
            studentName: _studentName,
            courseName: _courseName,
            grade: _grade,
            ipfsHash: _ipfsHash,
            hasMinted: false
        });
        
        emit StudentAllowed(_studentId, _studentName, _courseName, _grade, _ipfsHash);
    }
    
    // STUDENT: Mint their own certificate
    function mintMyCertificate(string memory _studentId) external nonReentrant {
        StudentEligibility memory eligibility = studentEligibility[_studentId];
        
        require(eligibility.isEligible, "Not eligible to mint");
        require(!eligibility.hasMinted, "Certificate already minted");
        require(bytes(studentAddressToId[msg.sender]).length == 0, "Address already used for minting");
        
        // Create certificate
        certificates[_studentId] = Certificate({
            studentId: _studentId,
            studentName: eligibility.studentName,
            courseName: eligibility.courseName,
            grade: eligibility.grade,
            ipfsHash: eligibility.ipfsHash,
            issueDate: block.timestamp,
            mintedBy: msg.sender,
            isMinted: true
        });
        
        // Update eligibility
        studentEligibility[_studentId].hasMinted = true;
        studentAddressToId[msg.sender] = _studentId;
        
        emit CertificateMinted(_studentId, msg.sender, block.timestamp, eligibility.ipfsHash);
    }
    
    // STUDENT: Check if they can mint
    function canIMint(string memory _studentId) external view returns (bool, string memory) {
        StudentEligibility memory eligibility = studentEligibility[_studentId];
        
        if (!eligibility.isEligible) {
            return (false, "Not eligible to mint");
        }
        
        if (eligibility.hasMinted) {
            return (false, "Certificate already minted");
        }
        
        return (true, "You can mint your certificate");
    }
    
    // ANYONE: Verify certificate
    function verifyCertificate(string memory _studentId) external view returns (
        bool exists,
        string memory studentName,
        string memory courseName,
        string memory grade,
        string memory ipfsHash,
        uint256 issueDate,
        address mintedBy
    ) {
        Certificate memory cert = certificates[_studentId];
        
        return (
            cert.isMinted,
            cert.studentName,
            cert.courseName,
            cert.grade,
            cert.ipfsHash,
            cert.issueDate,
            cert.mintedBy
        );
    }
    
    // ADMIN: Revoke student eligibility (before minting)
    function revokeStudentEligibility(string memory _studentId) external onlyRole(ADMIN_ROLE) {
        require(studentEligibility[_studentId].isEligible, "Student not eligible");
        require(!studentEligibility[_studentId].hasMinted, "Certificate already minted");
        
        delete studentEligibility[_studentId];
        emit StudentRevoked(_studentId);
    }
    
    // Get student eligibility status
    function getStudentEligibility(string memory _studentId) external view returns (
        bool isEligible,
        string memory studentName,
        string memory courseName,
        string memory grade,
        bool hasMinted
    ) {
        StudentEligibility memory eligibility = studentEligibility[_studentId];
        
        return (
            eligibility.isEligible,
            eligibility.studentName,
            eligibility.courseName,
            eligibility.grade,
            eligibility.hasMinted
        );
    }
    
    // Get certificate by student ID
    function getCertificate(string memory _studentId) external view returns (
        string memory studentName,
        string memory courseName,
        string memory grade,
        string memory ipfsHash,
        uint256 issueDate,
        address mintedBy,
        bool isMinted
    ) {
        Certificate memory cert = certificates[_studentId];
        
        return (
            cert.studentName,
            cert.courseName,
            cert.grade,
            cert.ipfsHash,
            cert.issueDate,
            cert.mintedBy,
            cert.isMinted
        );
    }
}