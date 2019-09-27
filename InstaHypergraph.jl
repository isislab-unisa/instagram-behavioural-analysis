module InstaHypergraph

using SimpleHypergraphs
import JSON
import HTTP

struct User
    id::Int64
    hashtags::Array{String}
    locations::Array{String}
end

mapquest_key = ""

"""
    Get a place name by reverse geocoding
"""
function get_location(lat::Real, lng::Real)
    lat_str = string(lat)
    lng_str = string(lng)
    endpoint = "https://www.mapquestapi.com/geocoding/v1/reverse?key=" * mapquest_key *
                "&location=" * lat_str * "," * lng_str
    try
        response = HTTP.get(endpoint)
        dict = Dict()
        dict = JSON.parse(String(response.body))
        location = dict["results"][1]["locations"][1]["adminArea5"]
        location
    catch e
        nothing
    end
end

"""
    Loads infos about a post from a file `fname`
"""
function get_post_info(fname::AbstractString)
    io = open(fname, "r")
    dicttxt = read(io, String)
    dict = Dict()
    dict = JSON.parse(dicttxt)
    close(io)

    id::Int64 = parse(Int, dict["owner"]["id"])

    #Retrieve hashtags from caption
    caption_edges = dict["edge_media_to_caption"]["edges"]
    caption = length(caption_edges) > 0 ? caption_edges[1]["node"]["text"] : nothing
    caption_hashtags::Array{String} = caption isa Nothing ? [] :
                                map(x->string(x.match), eachmatch(r"(?<!\w)#\w+", caption))
    #Retrieve hashtags from comments
    comment_edges = dict["edge_media_to_parent_comment"]["edges"]
    owner_comments = map(x->x["node"]["text"],
                        filter(x->x["node"]["owner"]["id"] == string(id), comment_edges))
    hashtag_comments = map(x->string(x.match), eachmatch(r"(?<!\w)#\w+", join((h for h in owner_comments), " ")))
    #Merge caption and comments hashtags
    hashtags = union(caption_hashtags, hashtag_comments)

    location_dict = dict["location"]
    location::Union{String,Nothing} = location_dict isa Nothing ? nothing : get_location(location_dict["lat"], location_dict["lng"]) 

    return id, hashtags, location
end

"""
    Creates a dict of users from a directory where each file contains infos about a post
"""
function get_users(directory::AbstractString)
    users_dict = Dict{Int,User}() #map instagram profiles ids into users with consecutive ids
    new_id = 1

    for file in readdir(directory) #for each post
        id, hashtags, location = get_post_info(directory * file)
        if !haskey(users_dict, id) #if the profile id has never been seen before create a new user
            users_dict[id] = User(new_id, [], [])
            new_id += 1
        end
        for hashtag in hashtags push!(users_dict[id].hashtags, hashtag) end
        if !(location isa Nothing) push!(users_dict[id].locations, location) end
    end
    users_dict
end

"""
    Creates a hypergraph from a directory of files containing infos about posts, where:
     - each post owner (user) is a vertex
     - each post location is a hyperedge

     The second argument `T` represents type of data in the hypegraph
"""
function create_loc_hypergraph(directory::AbstractString, T::Type{<:Real})
    print("Enter your mapquestapi key: ")
    global mapquest_key = readline(stdin)

    h = Hypergraph{T}(0, 0)
    weight = convert(T, 1)
    users_dict::Dict{Int,User} = get_users(directory)
    locations_dict = Dict{String,Dict{Int,T}}()

    for user in values(users_dict)
        add_vertex!(h)
        for location in user.locations
            if !haskey(locations_dict, location)
                locations_dict[location] = Dict{Int,T}()
            end
            locations_dict[location][user.id] = weight
        end
    end

    #println(locations_dict)
    for v in values(locations_dict)
        add_hyperedge!(h, vertices = v)
    end
    h
end

"""
    Creates a hypergraph from a directory of files containing infos about posts, where:
     - each post owner (user) is a vertex
     - each hashtag in the post is a hyperedge

     The second argument `T` represents type of data in the hypegraph
"""
function create_hashtag_hypergraph(directory::AbstractString, T::Type{<:Real})
    print("Enter your mapquestapi key: ")
    global mapquest_key = readline(stdin)
    h = Hypergraph{T}(0, 0)
    weight = convert(T, 1)
    users_dict::Dict{Int,User} = get_users(directory)
    hashtags_dict = Dict{String,Dict{Int,T}}()

    for user in values(users_dict)
        add_vertex!(h)
        for hashtag in user.hashtags
            if !haskey(hashtags_dict, hashtag)
                hashtags_dict[hashtag] = Dict{Int,T}()
            end
            hashtags_dict[hashtag][user.id] = weight
        end
    end

    #println(hashtags_dict)
    for v in values(hashtags_dict)
        add_hyperedge!(h, vertices = v)
    end
    h
end

end
