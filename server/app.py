from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
import google.generativeai as genai
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import undetected_chromedriver as uc
import os
from dotenv import load_dotenv


load_dotenv()

api_key = os.environ.get("GOOGLE_API_KEY")
if api_key is None:
    raise ValueError("GOOGLE_API_KEY environment variable not found.")
genai.configure(api_key=api_key)


llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
driver = uc.Chrome(options=chrome_options, service=Service())

def main():
    link = input("Enter the professor's link: ")
    driver.get(link)

    name = driver.find_element(By.CLASS_NAME, "NameTitle__Name-dowf0z-0").text
    subject = driver.find_element(By.CLASS_NAME, "TeacherDepartment__StyledDepartmentLink-fl79e8-0").text

    allReviews = driver.find_elements(By.CLASS_NAME, "Rating__RatingBody-sc-1rhvpxz-0")
    print(f"Found {len(allReviews)} reviews")

    reviews = []
    for element in allReviews:
        rating_values = element.find_elements(By.CLASS_NAME, "RatingValues__StyledRatingValues-sc-6dc747-0")
        quality = "N/A"
        difficulty = "N/A"
        
        if rating_values:
            rating_numbers = rating_values[0].find_elements(By.CLASS_NAME, "CardNumRating__CardNumRatingNumber-sc-17t4b9u-2")
            if len(rating_numbers) >= 2:
                quality = rating_numbers[0].text
                difficulty = rating_numbers[1].text
            elif len(rating_numbers) == 1:
                quality = rating_numbers[0].text
        
        comment_element = element.find_elements(By.CLASS_NAME, "Comments__StyledComments-dzzyvm-0")
        comment = comment_element[0].text if comment_element else "No comment"

        reviews.append({
            "name": name,
            "subject": subject,
            "quality": quality,
            "difficulty": difficulty,
            "comment": comment
        })

    print(f"Total reviews scraped: {len(reviews)}")
    print(reviews)

    driver.quit()

if __name__ == "__main__":
    main()