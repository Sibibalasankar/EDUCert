const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT", function () {
  let CertificateNFT;
  let certificateNFT;
  let owner;
  let collegeAuthority;
  let student;

  beforeEach(async function () {
    [owner, collegeAuthority, student] = await ethers.getSigners();

    CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    certificateNFT = await CertificateNFT.deploy();
    await certificateNFT.deployed();

    // Add college authority
    await certificateNFT.addCollegeAuthority(collegeAuthority.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await certificateNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await certificateNFT.name()).to.equal("EduCert");
      expect(await certificateNFT.symbol()).to.equal("EDUCT");
    });
  });

  describe("Minting Certificates", function () {
    it("Should mint a certificate successfully", async function () {
      const tx = await certificateNFT.connect(collegeAuthority).mintCertificate(
        student.address,
        "John Doe",
        "21CS001",
        "B.E - COMPUTER SCIENCE AND ENGINEERING",
        "B.E",
        "9.2",
        "Degree",
        "QmTestHash123",
        "CSE",
        "2021-2025",
        2025
      );

      await tx.wait();

      const certificate = await certificateNFT.getCertificate(1);
      expect(certificate.studentName).to.equal("John Doe");
      expect(certificate.registerNumber).to.equal("21CS001");
      expect(certificate.isRevoked).to.be.false;
    });

    it("Should prevent duplicate register numbers", async function () {
      await certificateNFT.connect(collegeAuthority).mintCertificate(
        student.address,
        "John Doe",
        "21CS001",
        "B.E - COMPUTER SCIENCE",
        "B.E",
        "9.2",
        "Degree",
        "QmTestHash123",
        "CSE",
        "2021-2025",
        2025
      );

      await expect(
        certificateNFT.connect(collegeAuthority).mintCertificate(
          student.address,
          "Jane Doe",
          "21CS001", // Same register number
          "B.E - COMPUTER SCIENCE",
          "B.E",
          "8.5",
          "Degree",
          "QmTestHash456",
          "CSE",
          "2021-2025",
          2025
        )
      ).to.be.revertedWith("Certificate already exists");
    });

    it("Should prevent unauthorized minting", async function () {
      await expect(
        certificateNFT.connect(student).mintCertificate(
          student.address,
          "John Doe",
          "21CS001",
          "B.E - COMPUTER SCIENCE",
          "B.E",
          "9.2",
          "Degree",
          "QmTestHash123",
          "CSE",
          "2021-2025",
          2025
        )
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await certificateNFT.connect(collegeAuthority).mintCertificate(
        student.address,
        "John Doe",
        "21CS001",
        "B.E - COMPUTER SCIENCE",
        "B.E",
        "9.2",
        "Degree",
        "QmTestHash123",
        "CSE",
        "2021-2025",
        2025
      );
    });

    it("Should verify valid certificate", async function () {
      const isValid = await certificateNFT.verifyCertificate(1);
      expect(isValid).to.be.true;
    });

    it("Should return false for non-existent certificate", async function () {
      const isValid = await certificateNFT.verifyCertificate(999);
      expect(isValid).to.be.false;
    });

    it("Should find certificate by register number", async function () {
      const certificate = await certificateNFT.getCertificateByRegisterNumber("21CS001");
      expect(certificate.studentName).to.equal("John Doe");
    });

    it("Should revoke certificate", async function () {
      await certificateNFT.connect(collegeAuthority).revokeCertificate(1, "Fraud detected");
      const isValid = await certificateNFT.verifyCertificate(1);
      expect(isValid).to.be.false;
    });
  });

  describe("College Authority Management", function () {
    it("Should add college authority", async function () {
      await certificateNFT.addCollegeAuthority(student.address);
      expect(await certificateNFT.collegeAuthorities(student.address)).to.be.true;
    });

    it("Should remove college authority", async function () {
      await certificateNFT.addCollegeAuthority(student.address);
      await certificateNFT.removeCollegeAuthority(student.address);
      expect(await certificateNFT.collegeAuthorities(student.address)).to.be.false;
    });

    it("Should prevent non-owner from managing authorities", async function () {
      await expect(
        certificateNFT.connect(student).addCollegeAuthority(collegeAuthority.address)
      ).to.be.reverted;
    });
  });
});