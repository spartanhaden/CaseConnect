# CaseConnect
This project is a semantic search engine for the [NamUs](https://www.namus.gov/MissingPersons/Search) missing persons database. It contains tools to scrape all the missing person cases and download all the associated images with each case. It also contains tools to embed the text and images into a vector space. The goal is to be able to search the database by text or image and get back similar cases. This could be useful for law enforcement to search for similar cases to a new case or for the public to improve the ability to search if someone is in the database.

## TODO

- [x] write a scraper for the database
- [x] embed all the text
- [x] embed the images
- [x] build the front end
- [ ] switch to embedding db from sklearn nn
- [ ] remove extra json data to improve embedding cost and relevance
- [ ] test search by image
- [ ] move cali db scraper to seperate file as there are SSL issues with their db

stretch goals

- [ ] use control net to convert sketches to images and then do image search on those semantically
- [ ] live generations from the sketches and then doing semantic search so you can see people as you draw
- [ ] add chat to prompt user for more details if the input is not very descriptive

## cost

$0.0004 / 1K tokens
34229931 tokens
$13.6919724

## data

| data | filetype | description | embeddings |
|------|----------|-------------|------------|
| json_cases | json | raw data | |
| case_images | jpg | raw data | |
| text_embeddings | json | embedded json_cases | text-embedding-ada-002 |
| image_embeddings | json | embedded case_images | ViT-bigG-14 |
| search_text | user input | user input text | ada-002 and ViT-bigG-14 |
| search_image | user input | user input image | ViT-bigG-14 |


