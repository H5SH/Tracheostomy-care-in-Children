import { StyleSheet } from "react-native";

const stylesVideo = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2C3E50",
  },
  video: {
    alignSelf: "center",
    marginTop: "5%",
    width: "80%",
    height: "70%",
    borderRadius: 10,
  },
  Buttons: {
    flexDirection: 'row',         // Align buttons in a row
    justifyContent: 'space-around', // Distribute space evenly between buttons
    alignItems: 'center',         // Center buttons vertically
    padding: 10,                  // Add some padding around the container
  },
  button: {
    backgroundColor: '#4C7E89',   // Background color of the button
    paddingVertical: 10,          // Vertical padding inside the button
    marginHorizontal: "10%",
    paddingHorizontal: 20,        // Horizontal padding inside the button
    borderRadius: 5,              // Rounded corners for the button
    alignItems: 'center',         // Center text inside the button
  },
});

const stylesCard = StyleSheet.create({
  touchContainer: {
    margin: 25,
    marginTop: 5,
    overflow: "hidden",
    borderRadius: 10,
  },
  image: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  text: {
    padding: 5,
    fontSize: 30,
    backgroundColor: "#008080",
    textAlign: "center",
    color: "white",
  },
});

const stylesAffiliations = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        padding: 20,
        backgroundColor: "white"
    },
    imageContainer: {
        flex: .4,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "flex-start",
    },
    image: {
        height: 100,
        width: 150,
        resizeMode: "contain",
    },
    affiliations:{
        fontSize: 20,
        fontWeight: "bold"
    },
    title: {
        fontSize: 40,
        fontWeight: "bold",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 25,
        marginBottom: 5,
        fontWeight: "bold"
    },
    text: {
        fontSize: 20,
        marginBottom: 5,
        marginLeft: 10,

    },
    button: {
        backgroundColor: "#2C3E50",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 20,
        alignItems: "center",
        justifyContent: "center",
        width: "60%",
        maxWidth: 300,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        textAlign: "center",
    },
})

export { stylesVideo, stylesCard, stylesAffiliations };
