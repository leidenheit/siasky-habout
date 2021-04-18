import {Button, Card, Container, Divider, Header, Icon, Image, List, Segment} from "semantic-ui-react";
import * as React from "react";
import imageBuiltWithSkynet from '../assets/built-with-skynet.png'

const HeaderSegment = (props) => {

    const debug = false;

    return (
        <>
            <Segment>
                <Container textAlign='left' floated='right'>
                    <Image spaced={'right'} floated={'left'} size={'small'} src={imageBuiltWithSkynet}/>
                    <Header size='huge'>Share and Rate Skapp Ideas - The Decentralized Way</Header>
                    <br/>
                    <Divider horizontal>
                        <Header as='h4'>
                            <List size={'mini'} horizontal={true}>
                                <List.Item icon='users' header={<a href='https://discord.com/invite/skynetlabs'>Skynet Labs Community</a>}/>
                                <List.Item icon='code'
                                           header={<a href='https://github.com/SkynetHQ/Skynet-Hive/issues/6'>Hackathon - Built To Explore - A Dream Of The Future</a>}
                                />
                            </List>
                        </Header>
                    </Divider>
                    <br/>
                    <br/>
                    <Card centered={true} fluid={true}>
                        <Card.Content header='Share and Rate Skapp Ideas' />
                        <Card.Content>
                            Did you got a Skapp in mind that has been missing for the Skynet ecosystem?<br/>
                            Then feel free to use this webpage to put your idea directly to Skynet and share it with our community.<br/>
                            What is more is, that you can also rate the ideas of other members.
                            <br/>
                            <br/>
                            Thank you for using and Happy Sharing!
                        </Card.Content>


                        <Card.Content extra>
                            <Icon name='info' />
                                {<a href='https://siasky.net/'>Learn more about Skynet</a>}
                        </Card.Content>
                    </Card>

                    {debug &&
                        <Button onClick={props.handleDebug}>Debug</Button>
                    }

                    <br/>
                </Container>
            </Segment>
        </>
    );
};

export default HeaderSegment;