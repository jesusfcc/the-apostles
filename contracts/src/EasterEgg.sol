// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EasterEgg is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public mintPrice;

    error InsufficientPayment();
    error NotTokenOwner();

    constructor(uint256 _mintPrice) ERC721("Easter Egg", "EGG") Ownable(msg.sender) {
        mintPrice = _mintPrice;
    }

    function mint(string calldata _tokenURI) external payable returns (uint256) {
        if (msg.value < mintPrice) revert InsufficientPayment();

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        return tokenId;
    }

    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _update(address(0), tokenId, msg.sender);
    }

    function evolve(uint256 oldTokenId, string calldata newTokenURI) external {
        if (ownerOf(oldTokenId) != msg.sender) revert NotTokenOwner();
        _update(address(0), oldTokenId, msg.sender);
        uint256 newId = _nextTokenId++;
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, newTokenURI);
    }

    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
