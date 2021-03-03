const { ImapFlow } = require("imapflow");
const client = new ImapFlow({
    host: "outlook.office365.com",
    port: 993,
    secure: true,
    auth: {
        user: "hanna.flores@unt.edu",
        pass: process.env.SPPASS,
    },
});

const main = async () => {
    console.log("maybe");
    // Wait until client connects and authorizes
    await client.connect();
    console.log("ye");
    // Select and lock a mailbox. Throws if mailbox does not exist
    let lock = await client.getMailboxLock("INBOX");
    try {
        // fetch latest message source
        let message = await client.fetchOne("*", { source: true });
        console.log(message.source.toString());

        // list subjects for all messages
        // uid value is always included in FETCH response, envelope strings are in unicode.
        for await (let message of client.fetch("1:*", { envelope: true })) {
            console.log(`${message.uid}: ${message.envelope.subject}`);
        }
    } finally {
        // Make sure lock is released, otherwise next `getMailboxLock()` never returns
        lock.release();
    }

    // log out and close connection
    await client.logout();
};

main().catch((err) => console.error(err));

var a = {
    level: 50,
    time: 1614800948563,
    pid: 53945,
    hostname: "libwebfactory.library.unt.edu",
    component: "imap-connection",
    cid: "guhf8ft39tc08u9ap2m1",
    err: {
        type: "Error",
        message:
            "140129938435008:error:1408F10B:SSL routines:ssl3_get_record:wrong version number:ssl/record/ssl3_record.c:332:\n",
        stack:
            "Error: 140129938435008:error:1408F10B:SSL routines:ssl3_get_record:wrong version number:ssl/record/ssl3_record.c:332:\n",
        library: "SSL routines",
        function: "ssl3_get_record",
        reason: "wrong version number",
        code: "ERR_SSL_WRONG_VERSION_NUMBER",
    },
    cid: "guhf8ft39tc08u9ap2m1",
};

var e = {
    library: "SSL routines",
    function: "ssl3_get_record",
    reason: "wrong version number",
    code: "ERR_SSL_WRONG_VERSION_NUMBER",
};
