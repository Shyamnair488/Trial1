import {
  addDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore"
import { db } from "./config"

export const sendMessage = async (roomId: string, senderId: string, content: string) => {
  try {
    const messagesRef = collection(db, "messages")
    await addDoc(messagesRef, {
      roomId,
      senderId,
      content,
      sentAt: serverTimestamp(),
      read: false,
    })
    console.log("Message sent successfully")
    return true
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

export const onMessagesReceived = (roomId: string, callback: (messages: any[]) => void) => {
  const messagesRef = collection(db, "messages")
  const q = query(messagesRef, where("roomId", "==", roomId), orderBy("sentAt", "asc"))

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        sentAt: data.sentAt instanceof Timestamp ? data.sentAt.toDate() : new Date(),
      }
    })
    callback(messages)
  })
}

export const markMessageAsRead = async (messageId: string) => {
  try {
    const messageRef = doc(db, "messages", messageId)
    await updateDoc(messageRef, {
      read: true,
    })
    return true
  } catch (error) {
    console.error("Error marking message as read:", error)
    throw error
  }
}

