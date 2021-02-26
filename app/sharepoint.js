var sprequest = require("sp-request");

/*
__metadata: {
    id: "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/Web/Lists(guid'4108c2d1-fe41-431a-87b6-f6dff29d04f0')",
    uri: "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/Web/Lists(guid'4108c2d1-fe41-431a-87b6-f6dff29d04f0')",
    etag: '"32"',
    type: 'SP.List'
},
ListItemEntityTypeFullName: 'SP.Data.Filament_x0020_InventoryListItem'

__metadata: {
    id: '863b5169-e052-4f9c-8cbc-fea940f868cc',
    uri: "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/Web/Lists(guid'4108c2d1-fe41-431a-87b6-f6dff29d04f0')/Items(117)",
    etag: '"3"',
    type: 'SP.Data.Filament_x0020_InventoryListItem'
},
FirstUniqueAncestorSecurableObject: { __deferred: [Object] },
RoleAssignments: { __deferred: [Object] },
AttachmentFiles: { __deferred: [Object] },
ContentType: { __deferred: [Object] },
GetDlpPolicyTip: { __deferred: [Object] },
FieldValuesAsHtml: { __deferred: [Object] },
FieldValuesAsText: { __deferred: [Object] },
FieldValuesForEdit: { __deferred: [Object] },
File: { __deferred: [Object] },
Folder: { __deferred: [Object] },
LikedByInformation: { __deferred: [Object] },
ParentList: { __deferred: [Object] },
Properties: { __deferred: [Object] },
Versions: { __deferred: [Object] },
FileSystemObjectType: 0,
Id: 117,
ServerRedirectedEmbedUri: null,
ServerRedirectedEmbedUrl: '',
ID: 117,
ContentTypeId: '0x00D1C2084141FE1A4387B6F6DFF29D04F0',


Title: 'OVERTURE',
Modified: '2021-02-26T22:03:51Z',
Created: '2021-02-05T21:34:23Z',
AuthorId: 13,
EditorId: 13,
OData__UIVersionString: '1.0',
Attachments: false,
GUID: '1a64bdf5-24ad-49f2-9550-2ef6d72441e2',
ComplianceAssetId: null,
FilamentType: 'PLA',
FilamentLocation: 'Willis 135',
Color: 'WHITE',
Openedon: null,
Notes: 'BRAND NEW (2/5/21)',
Weight_x0028_grams_x0029_: '1KG 295G / FS-PLA-1-005',
SecondReel: false,
SecondReelWeight: null,
OData__x0033_rd: null,
OData__x0034_th: null,
Total3ofReels: null,
Weightofallafter4th: null,
Filamentdiameter: '1.75mm',
Updatedon: '2/5/2021',
SumTEST: null,
RollID: 'FS-PLA-1-005'




__metadata: {
    id: "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/Web/Lists(guid'31f05ae1-2d25-43cf-b1ca-f7326d537070')",
    uri: "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/Web/Lists(guid'31f05ae1-2d25-43cf-b1ca-f7326d537070')",
    etag: '"22"',
    type: 'SP.List'
},
ListItemEntityTypeFullName: 'SP.Data.HannaIsTestingListItem'
*/

module.exports = function (spUser, spPass) {
    // Connect to SPO

    var requester = sprequest.create({
        username: spUser,
        password: spPass,
    });

    //createItem(requester)
    //getAllItems(requester);
    //getItemIDbyRollID(requester);
    updateItem(requester);

    var newRoll = {};
};

function createItem(requester) {
    var newRoll = {
        brand: "", //Title
        type: "", //FilamentType      --  ABS | PLA | NinjaFlex | Woodfill | Specialty
        diameter: "", //Filamentdiameter  --  1.75mm | 3.0 or 2.85mm | Other
        location: "", //FilamentLocation  --  Discovery Park M130 | Willis 135
        color: "", //Color
        dateOpened: "", //Openedon
        notes: "", //Notes
        dateUpdated: "", //Updatedon
        weight: "", //Weight_x0028_grams_x0029_
        rollID: "", //RollID
    };

    requester
        .requestDigest("https://myunt.sharepoint.com/sites/SparkMakerspace")
        .then((digest) => {
            return requester.post(
                "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/web/Lists(guid'31f05ae1-2d25-43cf-b1ca-f7326d537070')/items",
                {
                    headers: {
                        "X-RequestDigest": digest,
                    },
                    body: {
                        __metadata: { type: "SP.Data.HannaIsTestingListItem" },
                        Title: "Testing object",
                    },
                }
            );
        })
        .then(
            (response) => {
                console.log(response);
                if (response.statusCode === 204) {
                    console.log("It worked?");
                }
            },
            (err) => {
                if (err.statusCode === 404) {
                    console.log("List not found!");
                } else {
                    console.log(err);
                }
            }
        );
}

function getAllItems(requester) {
    requester
        .get(
            "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/Web/Lists(guid'4108c2d1-fe41-431a-87b6-f6dff29d04f0')/items?$filter=RollID eq 'FS-PLA-1-005'"
        )
        .then(function (response) {
            console.log(response.body.d.results);
        });
}

function getItemIDbyRollID(requester) {
    var rollID = "FS-ABS-11.2-001";
    requester
        .get(
            "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/Web/Lists(guid'4108c2d1-fe41-431a-87b6-f6dff29d04f0')/items?$filter=RollID eq '" +
                rollID +
                "'"
        )
        .then(function (response) {
            console.log(response.body.d.results[0].ID);
        });
}

function updateItem(requester) {
    requester
        .requestDigest("https://myunt.sharepoint.com/sites/SparkMakerspace")
        .then((digest) => {
            return requester.post(
                "https://myunt.sharepoint.com/sites/SparkMakerspace/_api/web/Lists(guid'4108c2d1-fe41-431a-87b6-f6dff29d04f0')/items(117)",
                {
                    body: {
                        __metadata: { type: "SP.Data.Filament_x0020_InventoryListItem" },
                        Notes: "DEAR LORD",
                    },
                    headers: {
                        "X-RequestDigest": digest,
                        "X-HTTP-Method": "MERGE",
                        "IF-MATCH": "*",
                    },
                }
            );
        })
        .then(
            (response) => {
                if (response.statusCode === 204) {
                    console.log("List title updated!");
                }
            },
            (err) => {
                if (err.statusCode === 404) {
                    console.log("List not found!");
                } else {
                    console.log(err);
                }
            }
        );
}
