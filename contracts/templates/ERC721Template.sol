pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMetadata.sol";
import "../interfaces/IERC20Factory.sol";

contract ERC721Template is ERC721, AccessControl {
    address private paymentCollector;
    address private ipHolder;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant METADATA_ROLE = keccak256("METADATA_ROLE");

   
    string private _name;
    string private _symbol;
    uint256 private tokenId = 1;
    bool private initialized;
    address public _metadata;
    bool private erc20Minted;
    address private _erc20Factory;
  

    modifier onlyNotInitialized() {
        require(
            !initialized,
            "ERC721Template: token instance already initialized"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address admin,
        address metadata,
        address erc20Factory,
        bytes memory _data,
        bytes memory flags
    ) public ERC721(name, symbol) {
      //  _metadata = metadata;
        _initialize(admin, name, symbol,metadata,erc20Factory,_data,flags);
        
    }

    function initialize(
        address admin,
        string calldata name,
        string calldata symbol,
        address metadata,
        address erc20Factory,
        bytes calldata _data,
        bytes calldata flags
    ) external onlyNotInitialized returns (bool) {
        return _initialize(admin, name, symbol,metadata,erc20Factory,_data,flags);
    }

    function _initialize(
        address admin,
        string memory name,
        string memory symbol,
        address metadata,
        address erc20Factory,
        bytes memory _data,
        bytes memory flags
    ) private returns (bool) {
        require(
            admin != address(0),
            "DataTokenTemplate: Invalid minter,  zero address"
        );
        require(metadata != address(0), "Metadata address cannot be zero");
        _metadata = metadata;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(METADATA_ROLE, admin);
        paymentCollector = admin;
        ipHolder = admin;
        _name = name;
        _symbol = symbol;
        _erc20Factory = erc20Factory;
        initialized = true;
        _createMetadata(flags, _data);
        return initialized;
        
    }

    function mint(address account) external {
        require(hasRole(MINTER_ROLE, msg.sender), "NOT MINTER_ROLE");
        tokenId += 1;
        _mint(account, tokenId);
    }

    function _createMetadata(bytes memory flags, bytes memory data) internal {
       // require(hasRole(METADATA_ROLE, msg.sender), "NOT METADATA_ROLE");
        require(_metadata != address(0), "Invalid Metadata address");

        IMetadata(_metadata).create(address(this), flags, data);
    }

    function update(bytes calldata flags, bytes calldata data) external {
        require(hasRole(METADATA_ROLE, msg.sender), "NOT METADATA_ROLE");
        IMetadata(_metadata).update(address(this), flags, data);
    }

    function createERC20( string calldata blob, string calldata name, string calldata symbol, uint256 cap) external {
        require(hasRole(MINTER_ROLE, msg.sender), "NOT MINTER_ROLE");
        require(erc20Minted == false, 'ERC20 Already Created');
        
        require(IERC20Factory(_erc20Factory).createToken(blob,name,symbol,cap,msg.sender) != address(0), 'ERC20Token creation failed'); // already checked when creating a new ERC20 in ERC20Factory, could be removerd
        erc20Minted = true;
    }
    /**
     * @dev name
     *      It returns the token name.
     * @return DataToken name.
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    /**
     * @dev symbol
     *      It returns the token symbol.
     * @return DataToken symbol.
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function isInitialized() public view returns (bool) {
        return initialized;
    }
}
