function Contact() {
    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
            <p className="text-gray-500 mb-8">Have a question? Drop us a message below.</p>
            <form className="flex flex-col gap-6">
                <input type="text" placeholder="Your Name" className="border border-gray-200 p-4 rounded-md focus:outline-none focus:border-black" />
                <input type="email" placeholder="Your Email Address" className="border border-gray-200 p-4 rounded-md focus:outline-none focus:border-black" />
                <textarea placeholder="How can we help?" className="border border-gray-200 p-4 rounded-md h-40 focus:outline-none focus:border-black"></textarea>
                <button type="button" className="bg-black text-white font-bold py-4 rounded-md hover:bg-gray-800 transition">Send Message</button>
            </form>
        </div>
    );
}
export default Contact;
