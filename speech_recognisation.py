import speech_recognition as sr

def main():
    recognizer = sr.Recognizer()
    
    # Use the default microphone as the audio source
    with sr.Microphone() as source:
        print("Adjusting for ambient noise... Please wait.")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        print("Listening... Speak now!")

        try:
            # Listen for speech
            audio = recognizer.listen(source, timeout=5)
            
            print("Recognizing speech...")
            # Recognize speech using Google Web Speech API
            text = recognizer.recognize_google(audio)
            
            print("You said: ", text)
        
        except sr.WaitTimeoutError:
            print("No speech detected within the timeout.")
        except sr.UnknownValueError:
            print("Could not understand the audio.")
        except sr.RequestError as e:
            print(f"Could not request results; {e}")

if __name__ == "__main__":
    main()
