import {Card, Container, Header, Icon, List, Segment} from "semantic-ui-react";
import * as React from "react";

const FooterSegment = () => {

    /*
    <List.Item
        icon='github'
        content={<a href='https://github.com/devAttila87/siasky-habout'>See the source on GitHub</a>}
    />
     */
    return (
        <>
            <Container>
                <footer>

                    <Card centered={true} fluid={true}>
                        <Card.Content>
                            Did you get a Skapp in mind that has been missing for the Skynet ecosystem?<br/>
                            Then feel free to use this webpage to put your idea directly to Skynet and share it with the community.<br/>
                            You as well as the community are welcomed to rate by liking an idea through the button on the right.<br/>
                            <br/>
                            Thank you for using this Skapp and Happy Sharing!
                        </Card.Content>
                        <Card.Content extra>
                            <Icon name='info circle' />
                            {<a href='https://siasky.net/'>Learn more about Skynet</a>}
                        </Card.Content>
                    </Card>
                    <Segment size={"small"}>
                        <Container textAlign='justified'>
                            <Header size='medium'>About</Header>
                            <List>
                                <List.Item
                                    icon='sticky note outline'
                                    content='This project was built during the "Built to Explore - A Dream of the Future" hackathon.'/>
                            </List>
                        </Container>
                    </Segment>
                </footer>
            </Container>
            <br/>
            <br/>
        </>
    );
};

export default FooterSegment;