// Import react components
// Import react components
import {useEffect, useState} from 'react';

// sia & skynet ecosystem
import {genKeyPairFromSeed, SkynetClient} from "skynet-js";
import {ContentRecordDAC} from '@skynethq/content-record-library';

// custom
import './App.css';
import SkynetSVG from "./assets/skynet.svg";
import {Button, Dimmer, Loader} from "semantic-ui-react";


/************************************************/
/*  Initialization
 */
/* TODO MySky should decide with what portal we go; so leave it empty in prod!
const skynetClient = new SkynetClient();
 */
const skynetPortal = 'https://siasky.net/';
const skynetClient = new SkynetClient(skynetPortal);

// skapp related
let skappdata;
let skappdataData = [];
// FIXME: secret and data container
const skappMembersDataKey = "shabout-members-debug-10001.json";
const skappSecret = "sup3rs3cr3t";

// Used to call method against the Content Record DAC's API.
const contentRecord = new ContentRecordDAC();

/************************************************/

/*  tbd
 */


function App() {

    // define app state helpers
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [dataKey, setDataKey] = useState('');
    // TODO remove initial
    const [idea, setIdea] = useState("An incredible idea!");
    const [filePath, setFilePath] = useState();
    const [userID, setUserID] = useState();
    const [mySky, setMySky] = useState();
    const [loggedIn, setLoggedIn] = useState(null);
    const [displaySuccess, setDisplaySuccess] = useState(false);

    // Choose a data domain for saving files in MySky
    const dataDomain = 'localhost';


    // On initial run, start initialization of MySky
    useEffect(() => {
        // When dataKey changes, update FilePath state.
        setFilePath(dataDomain + '/' + dataKey);

        // define async setup function
        async function initMySky() {
            try {
                console.log(`Initializing MySky...`);
                // Load invisible iframe and define app's data domain need for permission to write.
                const mySky = await skynetClient.loadMySky(dataDomain);

                // Load necessary DACs and permissions.
                await mySky.loadDacs(contentRecord);

                // read skapp related members and store the to react states
                skappdata = await readSkappDataFromSkyDB(skappMembersDataKey);
                // this is the memberlist
                skappdataData = skappdata.data;

                // Check if the user is already logged in with permissions.
                const loggedIn = await mySky.checkLogin();
                console.log(loggedIn ? `MySky -> already logged in` : `MySky -> login required`);
                // Set react state for login status and to access mySky in rest of app.
                setMySky(mySky);
                setLoggedIn(loggedIn);
                if (loggedIn) {
                    setUserID(await mySky.userID());
                }
            } catch (e) {
                console.error(`\tException: initMySky() -> ${e}`);
            }
        }

        // Call the async function
        initMySky().then(r => console.log(`MySky initialized`));
    }, [dataKey]);


    const handleDebug = async (event) => {
        event.preventDefault();
        console.log('Form Submitted');
        setLoading(true);

        const x = await skynetClient.portalUrl();
        console.log(`Initialized Skynet client with portal ${x}`);

        const loadedMembers = await readSkappDataFromSkyDB(skappMembersDataKey);

        generateDynamicName();
        setLoading(false);
    }


    const handleMySkyLogin = async () => {
        setLoading(true);
        console.log('Logging into MySky');
        // Try login again, opening popup. Returns true if successful.
        const status = await mySky.requestLoginAccess();
        // apply react status
        setLoggedIn(status);
        if (status) {
            const loggedInUser = await mySky.userID();
            // apply react state
            setUserID(loggedInUser);
            console.log(`MySkyUser -> ${loggedInUser}`);

            // add user to skapp when not already known
            const isKnownMember = doesMemberAlreadyExists(loggedInUser);
            if (!isKnownMember) {
                await storeSkappMember(generateDynamicName(), loggedInUser);
            }
            // await storeSkappMember(generateDynamicName(), loggedInUser);


            // handle load idea of user
            // TODO await handleLoadIdea();
        } else {
            console.log(`handleMySkyLogin returns status ${status}`);
        }
        setLoading(false);
    }


    // console.log(`${}`);


    function doesMemberAlreadyExists(potentialMember) {
        console.log(`Checking if user with public key "${potentialMember}" is already as member listed in ${JSON.stringify(skappdata.data)}`);
        for (let i = 0; i < skappdataData.members.length; i++) {
            const match = skappdataData.members[i].memberMySkyPublicKey === potentialMember;
            console.log(`match=${match};\t${skappdataData.members[i].memberMySkyPublicKey}\tvs.\t${potentialMember}`);
            if (match) {
                return true;
            }
        }

        return false;
    }


    const handleMySkyLogout = async () => {
        setLoading(true);
        console.log('Logging out of MySky');
        await mySky.logout();
        // apply react state
        setLoggedIn(false);
        setUserID('');
        setLoading(false);
        setIdea('');
    }


    const handleSetIdea = async () => {
        setLoading(true);
        try {
            await handleMySkyWrite(idea)
            setDisplaySuccess(true);
            setTimeout(() => setDisplaySuccess(false), 5000);
        } catch (error) {
            console.error(`error while handling set idea: ${error.message}`);
        }
        setLoading(false);
    };


    const handleLoadIdea = async () => {
        try {
            // Use getJSON ot load the user's information from SkyDB.
            const {data} = await mySky.getJSON(userID, filePath);
            console.log(`read data from MySky: \n\tuser="${userID}"\n\tjsonData=${JSON.stringify(data)}`);
            if (data) {
                setIdea(JSON.stringify(data));
            }
        } catch (error) {
            console.error(`error while reading data from MySky -> getJSON ${error.message}`);
            setIdea('');
        }
    };


    const handleMySkyWrite = async (jsonData) => {
        try {
            // Use setJSON to save the user's information to MySky file
            await mySky.setJSON(filePath, jsonData);
            console.log(`successfully written data to MySky: \n\tuser="${userID}"\n\tjsonData=${JSON.stringify(jsonData)}`);
        } catch (e) {
            console.error(`error while writing data to MySky -> setJSON: ${e.message}`);
        }
    }


    // stores the logged in user's public key and a name to skapp's skydb.
    async function storeSkappMember(memberName, memberMySkyPublicKey) {
        setLoading(true);

        // todo handle member
        const memberJson = {memberName: memberName, memberMySkyPublicKey: memberMySkyPublicKey}
        if (skappdataData === null) {
            skappdataData = {members: []};
        }
        skappdataData.members.push(memberJson);


        await writeSkappDataToSkyDB(skappMembersDataKey, skappdataData);
        setLoading(false);
    }


    // reads the public keys and names of all known users from skapp's skydb.
    async function readSkappDataFromSkyDB(dataKey) {
        setLoading(true);
        try {
            const skappPublicKey = genKeyPairFromSeed(skappSecret).publicKey;
            const getJsonResult = await skynetClient.db.getJSON(skappPublicKey, dataKey);
            console.log(`readSkappDataFromSkyDB -> getJsonResult=${JSON.stringify(getJsonResult)}`);
            setLoading(false);
            return getJsonResult;
        } catch (e) {
            console.error(`error reading skapp data: ${e.message}`);
        }
    }


    // writes the public keys and names of all known users to skapp's skydb.
    // Workaround since it's deprecated; MySky does not support saving a "random" context to SkyDB.
    async function writeSkappDataToSkyDB(dataKey, jsonData) {
        setLoading(true);
        try {

            console.log(`writeSkappDataToSkyDB -> jsonData to write=${JSON.stringify(jsonData)}`);

            const skappPrivateKey = genKeyPairFromSeed(skappSecret).privateKey;
            const setJsonResult = await skynetClient.db.setJSON(skappPrivateKey, dataKey, jsonData);
            console.log(`writeSkappDataToSkyDB -> setJsonResult=${JSON.stringify(setJsonResult)}`);
            setLoading(false);
            return setJsonResult;
        } catch (e) {
            console.error(`error writing skapp data: ${e.message}`);
        }
    }


    // generate dynamic name, e.g. for a skapp member
    function generateDynamicName() {
        const names = [
            "Teddy",
            "Weston",
            "Paul",
            "Wynona",
            "Dean",
            "Augustina",
            "Norene",
            "Suk",
            "Hye",
            "Jolanda"
        ]

        const dynamicName = names[Math.floor(Math.random() * names.length)];
        const suffix = Math.random().toString(16).substr(2, 8);
        console.debug(`Generated dynamic name: ${dynamicName}; Suffix: ${suffix}`);
        return dynamicName.concat("-", suffix);
    }


    // this is the actual layout; not a beauty but it's something :)
    return (
        <div
            className="bg-background min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">


                <div>
                    <img className="mx-auto h-24 w-auto" src={SkynetSVG} alt="Skynet"/>
                    <h2 className="mt-6 text-center text-4xl sm:text-5xl font-extrabold text-gray-300">
                        how about Skapp?
                    </h2>
                    <p className="mt-2 text-center text-sm leading-5 text-gray-300">
                        hackathon project
                    </p>
                    <p className="mt-2 text-center text-sm leading-5 text-gray-300">
                        You got an incredible idea for the Skynet ecosystem?
                        Write it down here and let our community know!
                    </p>
                </div>


                <div>
                    <Button onClick={handleDebug}>
                        Debug
                    </Button>
                    <div>
                        <Dimmer active={loading}>
                            <Loader active={loading}/>
                        </Dimmer>

                        {loggedIn
                            ? <Button onClick={handleMySkyLogout}>Logout from MySky</Button>
                            : <Button onClick={handleMySkyLogin}>Log into MySky</Button>
                        }
                    </div>


                    <form className="mt-8">
                        <div className="rounded-md shadow-sm">
                            <div>
                                <textarea
                                    rows={3}
                                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5"
                                    value={idea}
                                    autoFocus={true}
                                    onChange={(event) => setIdea(event.target.value)}
                                    placeholder="You did not set an idea yet"
                                    disabled={!loggedIn || (loggedIn && loading)}
                                />
                            </div>
                        </div>
                    </form>

                    <div className="mt-6">
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition duration-150 ease-in-out"
                            onClick={handleSetIdea}
                            disabled={(loggedIn && loading) || !loggedIn}
                        >
                            {loading ? "Sending..." : "Save this idea"}
                        </button>
                    </div>
                    {displaySuccess && (
                        <span className="text-sm text-green-500 font-bold">
                  Your idea has been saved!
                </span>
                    )}


                </div>


                <footer className="mt-6 text-center text-sm leading-5 text-gray-300">
                    Read more on{" "}
                    <a
                        className="text-green-500 hover:underline"
                        href="https://github.com/devAttila87/siasky-habout"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GitHub
                    </a>

                    Hackathon{" "}
                    <a
                        className="text-green-500 hover:underline"
                        href="https://github.com/SkynetHQ/Skynet-Hive/issues/6"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Built To Explore - A Dream Of The Future
                    </a>
                </footer>
            </div>
        </div>
    );
}

export default App;
