import React, { Component } from 'react';
import { Card,Icon, Input, Rating } from 'react-native-elements';
import { Text, View, ScrollView, FlatList,Modal,Button,StyleSheet ,Alert, PanResponder,Share } from 'react-native';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite } from '../redux/ActionCreators';
import { postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';



const mapStateToProps = state => {
    return{
        campsites:state.campsites,
        comments:state.comments,
        favorites: state.favorites
    };
};

const mapDispatchToProps = {
    postFavorite: campsiteId => postFavorite(campsiteId),
    postComment: (campsiteId,rating,author,text) => postComment(campsiteId,rating,author,text)
};



function RenderComments({comments}) {

    const renderCommentItem = ({item}) => {
        return (
            <View style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.text}</Text>
                <Rating
                   startingValue={item.rating} 
                   imageSize={10}
                   style={{alignItems:'flex-start',paddingVertical:'5%'}}
                   readonly
                />
                <Text style={{fontSize: 12}}>{`-- ${item.author}, ${item.date}`}</Text>
            </View>
        );
    };

    return (
        <Animatable.View animation='fadeInUp' duration={2000} delay={1000}>
        <Card title='Comments'>
            <FlatList
                data={comments}
                renderItem={renderCommentItem}
                keyExtractor={item => item.id.toString()}
            />
        </Card>
        </Animatable.View>
    );
}

function RenderCampsite(props) {

    const {campsite} = props;

    const recognizeComment = ({dx}) => (dx > 200) ? true : false;

    

    //This is to help create an annimation with the onPanResponderGrand. Not mandatory//
    const view = React.createRef();

    const recognizeDrag = ({dx}) => (dx < -200) ? true : false;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        
        //works with React.CreateRef() for rubberband animation//  
        onPanResponderGrant: () => {
            view.current.rubberBand(1000)
            .then(endState => console.log(endState.finished ? 'finished' : 'canceled'));
        },

        onPanResponderEnd: (e, gestureState) => {
            console.log('pan responder end', gestureState);
            if (recognizeDrag(gestureState)) {
                Alert.alert(
                    'Add Favorite',
                    'Are you sure you wish to add ' + campsite.name + ' to favorites?',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => console.log('Cancel Pressed')
                        },
                        {
                            text: 'OK',
                            onPress: () => props.favorite ?
                                console.log('Already set as a favorite') : props.markFavorite()
                        }
                    ],
                    { cancelable: false }
                );

              }

              else if(recognizeComment(gestureState)){
                  props.onShowModal();
              }
            
            return true;
        }
    });

    //function to activate sharing//
    const shareCampsite = (title, message, url) => {
        Share.share({
            title: title,
            message: `${title}: ${message} ${url}`,
            url: url
        },{
            dialogTitle: 'Share ' + title
        });
    };

    if (campsite) {
        return (
            <Animatable.View animation='fadeInDown' duration={2000} delay={1000}
            {...panResponder.panHandlers}
            ref={view}
            >

            <Card
                featuredTitle={campsite.name}
                image={{uri: baseUrl + campsite.image}}>
                <Text style={{margin: 10}}>
                    {campsite.description}
                </Text>
                <View style={styles.cardRow}>
                <Icon
                    name={props.favorite ? 'heart' : 'heart-o'}
                    type='font-awesome'
                    color='#f50'
                    raised
                    reverse
                    onPress={() => props.favorite ? 
                        console.log('Already set as a favorite') : props.markFavorite()}
                />
                <Icon
                     name='pencil'
                     type='font-awesome'
                     color='#5637DD'
                     raised
                     reverse
                     onPress={() => props.onShowModal()}
                />

                    <Icon
                            name={'share'}
                            type='font-awesome'
                            color='#5637DD'
                            raised
                            reverse
                            onPress={() => shareCampsite(campsite.name, campsite.description, baseUrl + campsite.image)} 
                        />

                </View>
                
            </Card>
            </Animatable.View>

        );
    }
    return <View />;
}

class CampsiteInfo extends Component {
    constructor(props){
        super(props);

         this.state={
             rating:5,
             author:"",
             text:"",
             showModal:false
        }
    }

    toggleModal(){
        this.setState({showModal: !this.state.showModal});
    }

    handleComment(campsiteId){
        this.props.postComment(campsiteId,this.state.rating,this.state.author,this.state.text);
        //To display on console---console.log(JSON.stringify(this.state));
        this.toggleModal();
    }

    resetForm(){
        this.setState({
            rating:5,
             author:"",
             text:"",
            showModal:false
        })

    }


    markFavorite(campsiteId) {
        this.props.postFavorite(campsiteId);
    }
   
    //This helps to set the naviagion header//
    static navigationOptions = {
        title: 'Campsite Information'
    }

    render() {
        const campsiteId = this.props.navigation.getParam('campsiteId');
        const campsite = this.props.campsites.campsites.filter(campsite => campsite.id === campsiteId)[0];
        const comments = this.props.comments.comments.filter(comment => comment.campsiteId === campsiteId);
        return (
            <ScrollView>
                <RenderCampsite campsite={campsite}
                    favorite={this.props.favorites.includes(campsiteId)}
                     markFavorite={() => this.markFavorite(campsiteId)}
                     onShowModal={() => this.toggleModal()}
                 />
                     
                <RenderComments comments={comments} />
                 
                 <Modal animationType={'slide'}
                    transparent={false}
                    visible={this.state.showModal}
                    onRequestClose={() => this.toggleModal()} 
                 >
                     <View style={styles.modal}>
                         
                         <Rating
                            type='star'
                            showRating
                            startingValue={this.state.rating}
                            imageSize={40}
                            onFinishRating={rating => this.setState({rating: rating})} 
                            style={{paddingVertical: 10}}
                         />

                         <Input
                            placeholder="Author"
                            leftIconContainerStyle={{paddingRight: 10}}
                            leftIcon={{ type: 'font-awesome', name: 'user-o' }}
                            onChangeText={author=>this.setState({author:author})}
                            value={this.state.author}
                           />

                           <Input
                             placeholder="Comment"
                             leftIconContainerStyle={{paddingRight: 10}}
                             leftIcon={{ type: 'font-awesome', name: 'comment-o' }}
                             onChangeText={text=>this.setState({text:text})}
                             value={this.state.text} 
                           />

                           <View style={{margin: 10}}>
                               <Button
                                  title='Submit'
                                  color='#5637DD'
                                  onPress={() =>{
                                      this.handleComment(campsiteId);
                                      this.resetForm();
                                  }}
                               />
                           </View>
                         
                         <View style={{margin: 10}}>
                             <Button
                                onPress={()=>{
                                    this.toggleModal();
                                    this.resetForm();

                                }}

                                color= '#808080'
                                title='Cancel'
                             />
                         </View>
                     </View>
                 
                 </Modal>

            </ScrollView>
        );
        
    }
}

const styles = StyleSheet.create({
    cardRow:{
        alignItems:'center',
        justifyContent:'center',
        flex: 1,
        flexDirection:'row',
        margin:20

    },
    modal:{
        justifyContent:'center',
        margin: 20
    }
})

export default connect(mapStateToProps, mapDispatchToProps)(CampsiteInfo);