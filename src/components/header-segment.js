import {Container, Divider, Header, Image, List, Segment} from "semantic-ui-react";
import * as React from "react";
import imageBuiltWithSkynet from '../assets/built-with-skynet.png'

const HeaderSegment = () => {
    return (
        <>
            <Segment>
                <Container textAlign='left' floated='right'>
                    <Image spaced={'right'} floated={'left'} size={'small'} src={imageBuiltWithSkynet}/>
                    <Header size='huge'>
                        HAS - How About Skapp?
                        <Header.Subheader>Share, Vote and Discuss - The decentralized Way</Header.Subheader>
                    </Header>
                    <Divider horizontal>
                        <Header as='h4'>
                            <List size={'mini'} horizontal={true}>
                                <List.Item icon='users'
                                           header={<a href='https://discord.com/invite/skynetlabs'>Skynet Labs
                                               Community</a>}/>
                                <List.Item icon='code'
                                           header={<a href='https://github.com/SkynetHQ/Skynet-Hive/issues/6'>Hackathon
                                               - Built To Explore - A Dream Of The Future</a>}
                                />
                            </List>
                        </Header>
                    </Divider>
                    <br/>
                </Container>
            </Segment>
        </>
    );
};

export default HeaderSegment;