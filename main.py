# Dependencies
import os
import requests
import pandas as pd
import numpy as np
from config import league_id, espn_s2, swid
import matplotlib.pyplot as plt
import pdfkit

# Dataframe Options
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)
pd.set_option('display.colheader_justify', 'center')

# Define URL parameters
league_id = league_id
year = 2024
week = 1
espn_s2 = espn_s2
swid = swid

# Prompt user for week input
while True:
    try:
        week = int(input("Please enter the week number you want to analyze (1-14): "))
        if 1 <= week <= 15:
            break
        else:
            print("Week number should be between 1 and 14. Please try again.")
    except ValueError:
        print("Please enter a valid number.")
        print("Please enter a valid number.")

# define output variables
folder = 'results'
summary_file = f"La_Liga_del_Fuego_{year}_Season_Results.csv"
weekly_file = f"La_Liga_del_Fuego_{year}_Season_Week_{week}_Results.csv"
laLiga_file = f"La_Liga_del_Fuego_{year}_Season_Week_{week}_Current_Standings.csv"

laLiga_path = os.path.join(folder, laLiga_file)
summary_path = os.path.join(folder, summary_file)
weekly_path = os.path.join(folder, weekly_file)


# Define the URL with our parameters
#url = f'https://fantasy.espn.com/apis/v3/games/ffl/seasons/{year}/segments/0/leagues/{league_id}'
url = f'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{year}/segments/0/leagues/{league_id}'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Referer': 'https://fantasy.espn.com/',
    'Origin': 'https://fantasy.espn.com'
}

# Pull team and matchup data from the URL 
matchup_response = requests.get(url, 
                                params={"leagueId"        : league_id,
                                        "seasonId"        : year,
                                        "matchupPeriodId" : week,
                                        "view"            : "mMatchup"},
                                cookies={"swid"    : swid,
                                         "espn_s2" : espn_s2},
                                headers=headers)
                                    
team_response = requests.get(url, 
                             params={"leagueId"        : league_id,
                                     "seasonId"        : year,
                                     "matchupPeriodId" : week,
                                     "view"            : "mTeam"},
                             cookies={"swid"    : swid,
                                      "espn_s2" : espn_s2},
                             headers=headers)

# Check if the request was successful
if matchup_response.status_code != 200:
    print(f"Failed to fetch matchup data: {matchup_response.status_code}")
    print(f"Response text: {matchup_response.text}")
    exit()

if team_response.status_code != 200:
    print(f"Failed to fetch team data: {team_response.status_code}")
    print(f"Response text: {team_response.text}")
    exit()
#print(f"Response status code: {matchup_response.status_code}")
#print(f"Response content: {matchup_response.text}")

try:
    matchup_json = matchup_response.json()
except ValueError:
    print("Error: Unable to parse JSON response for matchup data.")
    exit()

# Transform the response into a json
matchup_json = matchup_response.json()
team_json = team_response.json()


# Transform both of the json outputs into DataFrames
matchup_df = pd.json_normalize(matchup_json['schedule'])
matchup_df.to_csv("raw_data.csv")

team_df = pd.json_normalize(team_json['teams'])
team_df.to_csv("raw_team_data.csv")

# Define the column names needed
matchup_column_names = {
    'matchupPeriodId':'Week', 
    'away.teamId':'Team1', 
    'away.totalPoints':'Score1',
    'home.teamId':'Team2', 
    'home.totalPoints':'Score2'
}

team_column_names = {
    'id':'id',
    'name':'Name',
    'playoffSeed':'ESPN Rank',
    'record.overall.wins':'Wins',
    'record.overall.losses':'Losses',
    'record.overall.ties':'Ties',
    'record.overall.percentage':'Win Percentage',
    'record.overall.pointsFor':'Points For',
    'record.overall.pointsAgainst':'Points Against'
}

# Reindex based on column names defined above
matchup_df = matchup_df.reindex(columns=matchup_column_names).rename(columns=matchup_column_names)

# Add a new column for regular/playoff game based on week number
matchup_df['Type'] = ['Regular' if week<=14 else 'Playoff' for week in matchup_df['Week']]

team_df = team_df.reindex(columns=team_column_names).rename(columns=team_column_names)


# Drop all columns except id and Name
names_df = team_df.filter(['id', 'Name'])

# (1) Rename Team1 column to id
matchup_df = matchup_df.rename(columns={"Team1":"id"})

# (1) Merge DataFrames to get team names instead of ids and rename Name column to Name1
matchup_df = matchup_df.merge(names_df, on=['id'], how='left')
matchup_df = matchup_df.rename(columns={'Name':'Name1'})

# (1) Drop the id column and reorder columns
matchup_df = matchup_df[['Week', 'Name1', 'Score1', 'Team2', 'Score2', 'Type']]

# (2) Rename Team1 column to id
matchup_df = matchup_df.rename(columns={"Team2":"id"})

# (2) Merge DataFrames to get team names instead of ids and rename Name column to Name2
matchup_df = matchup_df.merge(names_df, on=['id'], how='left')
matchup_df = matchup_df.rename(columns={'Name':'Name2'})

# (2) Drop the id column and reorder columns
matchup_df = matchup_df[['Week', 'Name1', 'Score1', 'Name2', 'Score2', 'Type']]
print("========= R E S U L T S =========")
print(matchup_df)
print("=================================")

############################ CRAZY BUTLER MATH ###################################
# Make a copy to do crazy Butler maths
butler_df = matchup_df

def rank_teams_for_week(week):
    week_df = butler_df[butler_df['Week'] == week]
    butler_df1 = week_df[['Week', 'Name1', 'Score1']].rename(columns={'Name1': 'Name', 'Score1': 'Score'})
    butler_df2 = week_df[['Week', 'Name2', 'Score2']].rename(columns={'Name2': 'Name', 'Score2': 'Score'})

    teams_df = pd.concat([butler_df1, butler_df2])
    teams_df['Rank'] = teams_df.groupby('Week')['Score'].rank(ascending=False).astype(int)

    return teams_df[['Name', 'Rank']]

def calculate_average_rank_and_rerank(upto_week):
    avg_ranks = []

    for week in range(1, upto_week + 1):
        avg_ranks.append(rank_teams_for_week(week))

    # Concatenate all week data and calculate mean rank
    all_weeks_df = pd.concat(avg_ranks)
    avg_rank_df = all_weeks_df.groupby('Name')['Rank'].mean().reset_index()

    # Re-rank based on average rank
    avg_rank_df['Re-rank'] = avg_rank_df['Rank'].rank().astype(int)

    # Assign point value based on re-rank
    avg_rank_df['Points'] = 13 - avg_rank_df['Re-rank']

    return avg_rank_df.sort_values(by='Re-rank')

butler_result_df = calculate_average_rank_and_rerank(week)
##################################################################################

# Make percentage a readible percentage
team_df['Win Percentage'] = team_df['Win Percentage'].mul(100).round(2)

# Round Points
team_df['Points For'] = team_df['Points For'].round(2)
team_df['Points Against'] = team_df['Points Against'].round(2)

# Assign points (more points is good) based on ESPN Rank
team_df['ESPN Rank LaLiga Bucks'] = 13 - team_df['ESPN Rank']

# Assign points (more points is good) to 
team_df['Points For LaLiga Bucks'] = 13 - team_df['Points For'].rank(method='min', ascending=False)

# Convert to int for readibility
team_df['Points For LaLiga Bucks'] = pd.to_numeric(team_df['Points For LaLiga Bucks'], downcast='integer')

# Add Butler's special sauce to the results
merged_df = pd.merge(team_df, butler_result_df[['Name', 'Points']], on='Name', how='left')

# Rename the 'Points' column
merged_df.rename(columns={'Points': 'Avg Weekly Pts Rank Liga Bucks'}, inplace=True)

# Add a column for total LaLiga Bucks
merged_df['Total LaLiga Bucks'] = merged_df['ESPN Rank LaLiga Bucks'] + merged_df['Points For LaLiga Bucks'] + merged_df['Avg Weekly Pts Rank Liga Bucks']
merged_df = merged_df.sort_values(by='Total LaLiga Bucks', ascending=False)

# Assign a Playoff Seed to each team
merged_df['Current Playoff Seed'] = merged_df['Total LaLiga Bucks'].rank(method='min',ascending=True)
merged_df['Current Playoff Seed'] = pd.to_numeric(merged_df['Current Playoff Seed'], downcast='integer')

# Tiebreaker!
merged_df = merged_df.sort_values(by=['Current Playoff Seed', 'Points For'], ascending=[False, False])

# Step 2: Re-assign the "Current Playoff Seed"
merged_df['Current Playoff Seed'] = range(1, len(merged_df) + 1)

print(merged_df)
#with open(laLiga_path, 'w') as f:
#    f.write(merged_df.to_string(index=False))

week_matchup_df = matchup_df[matchup_df['Week'] == week]

# Output the DataFrame to a csv
matchup_df.to_csv(summary_path)
merged_df.to_csv(laLiga_path)
week_matchup_df.to_csv(weekly_path)


# Convert dataframe to a nice table image
fig, ax = plt.subplots(figsize=(12, 4))  # set the size that you'd like (width, height)
ax.axis('off')
tbl = ax.table(cellText=merged_df.values, colLabels=merged_df.columns, cellLoc = 'center', loc='center')

# Make the cells larger to fit the text; you can set these values as you prefer
tbl.auto_set_font_size(True)
tbl.scale(2.0, 2.0)

plt.savefig("dataframe.png")

# Convert the image to PDF using pdfkit
pdfkit.from_file('dataframe.png', 'dataframe.pdf')

#from reportlab.lib.pagesizes import letter, landscape
#from reportlab.lib import colors
#from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
#
#
## Convert the dataframe to a list of lists
#data_list = merged_df.values.tolist()
#column_names = list(merged_df.columns)
#data_list.insert(0, column_names)
#
## Create the PDF
#pdf_path = "Week_{week}_Results.pdf"
#pdf = SimpleDocTemplate(pdf_path, pagesize=landscape(letter))
#
## Create the table
#table = Table(data_list)
#style = TableStyle([
#    ('BACKGROUND', (0,0), (-1,0), colors.grey),
#    ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke),
#    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
#    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
#    ('FONTSIZE', (0,0), (-1,0), 14),
#    ('BOTTOMPADDING', (0,0), (-1,0), 12),
#    ('BACKGROUND', (0,1), (-1,-1), colors.beige),
#    ('GRID', (0,0), (-1,-1), 1, colors.black)
#])
#table.setStyle(style)
#
## Add the table to the PDF
#pdf.build([table])
#
#print(f"PDF saved to {pdf_path}")